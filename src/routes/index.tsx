import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, ListChecks, Users, type LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth-guard";
import { cn } from "@/lib/utils";
import { useDashboardMetrics, useProjectHealth, useThroughput } from "@/lib/tasks-api";

export const Route = createFileRoute("/")({
  beforeLoad: requireAdmin,
  head: () => ({
    meta: [
      { title: "Dashboard — CodOps Task & HR Intelligence" },
      {
        name: "description",
        content:
          "Live overview of task throughput, on-time completion rate, overdue work and active teams.",
      },
      { property: "og:title", content: "Dashboard — CodOps" },
      {
        property: "og:description",
        content: "Live overview of task throughput, completion rate and team health.",
      },
    ],
  }),
  component: Dashboard,
});

type Tone = "mint" | "default" | "destructive";

interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  tone: Tone;
}

function MetricCard({ label, value, sub, icon: Icon, tone }: MetricCardProps) {
  const valueColor =
    tone === "mint" ? "text-mint" : tone === "destructive" ? "text-destructive" : "text-foreground";
  const iconColor =
    tone === "mint"
      ? "text-mint"
      : tone === "destructive"
        ? "text-destructive"
        : "text-muted-foreground";
  return (
    <Card className="relative gap-0 overflow-hidden rounded-2xl border-border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </p>
        <Icon className={cn("size-4 shrink-0", iconColor)} />
      </div>
      <p className={cn("mt-4 font-mono text-3xl font-bold tracking-tight", valueColor)}>{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

function Dashboard() {
  const metricsQ = useDashboardMetrics();
  const healthQ = useProjectHealth();
  const throughputQ = useThroughput();

  const metrics = metricsQ.data ?? null;
  const loading = metricsQ.isLoading || throughputQ.isLoading || healthQ.isLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Delivery health across every team, project and evaluation cycle."
      />

      {loading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="gap-0 rounded-2xl border-border bg-card p-5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-4 h-8 w-24" />
              <Skeleton className="mt-2 h-3 w-16" />
            </Card>
          ))}
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Tasks"
            value={String(metrics?.totalTasks ?? 0)}
            sub={`${metrics?.completedTasks ?? 0}/${metrics?.totalTasks ?? 0} done`}
            icon={ListChecks}
            tone="default"
          />
          <MetricCard
            label="On-Time Completion"
            value={`${metrics?.onTimeCompletionPct ?? 0}%`}
            sub={`${metrics?.completedOnTime ?? 0}/${metrics?.completedTasks ?? 0} on time`}
            icon={CheckCircle2}
            tone="mint"
          />
          <MetricCard
            label="Overdue Tasks"
            value={String(metrics?.overdueTasks ?? 0)}
            sub="past due date"
            icon={AlertTriangle}
            tone={(metrics?.overdueTasks ?? 0) > 0 ? "destructive" : "default"}
          />
          <MetricCard
            label="Active Teams"
            value={String(metrics?.activeTeams ?? 0)}
            sub={`${metrics?.totalTeams ?? 0} teams in workspace`}
            icon={Users}
            tone="mint"
          />
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl border-border bg-card p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold tracking-tight">Task Throughput</h2>
              <p className="text-xs text-muted-foreground">Created vs completed, last 8 weeks</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" /> Created
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-mint" /> Completed
              </span>
            </div>
          </div>
          {throughputQ.isLoading ? (
            <div className="flex h-64 items-end gap-3">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <Skeleton key={i} className="h-4/5 flex-1" />
              ))}
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={throughputQ.data ?? []} margin={{ left: -20, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--mint)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--mint)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="week"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stroke="var(--primary)"
                    strokeWidth={2}
                    fill="url(#gCreated)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="var(--mint)"
                    strokeWidth={2}
                    fill="url(#gDone)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5">
          <h2 className="text-sm font-bold tracking-tight">Project Health</h2>
          <p className="text-xs text-muted-foreground">Aggregated from live tasks</p>
          <div className="mt-5 space-y-5">
            {healthQ.isLoading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-1.5 w-full" />
                </div>
              ))
            ) : (healthQ.data ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No projects yet.
              </p>
            ) : (
              (healthQ.data ?? []).map((p) => (
                <div key={p.project_id} className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-semibold">{p.project_name}</p>
                    <span className="shrink-0 font-mono text-xs font-bold text-mint">
                      {p.project_progress_pct}%
                    </span>
                  </div>
                  <Progress value={p.project_progress_pct ?? 0} className="mt-2 h-1.5" />
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {p.completed_tasks}/{p.total_tasks} done · {p.overdue_tasks} overdue
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
