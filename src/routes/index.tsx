import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  ListChecks,
  Users,
} from "lucide-react";
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
import { KanbanBoard } from "@/components/kanban-board";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { projectHealth, throughputSeries } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
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

const metrics = [
  {
    label: "Total Tasks",
    value: "1,248",
    delta: "+8.2%",
    up: true,
    icon: ListChecks,
    positive: false,
  },
  {
    label: "On-Time Completion",
    value: "92.4%",
    delta: "+4.1%",
    up: true,
    icon: CheckCircle2,
    positive: true,
  },
  {
    label: "Overdue Tasks",
    value: "17",
    delta: "-23.0%",
    up: false,
    icon: AlertTriangle,
    positive: false,
  },
  { label: "Active Teams", value: "12", delta: "+2", up: true, icon: Users, positive: true },
];

function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        subtitle="Delivery health across every team, project and evaluation cycle."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <Card
            key={m.label}
            className="relative gap-0 overflow-hidden rounded-2xl border-border bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 truncate text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {m.label}
              </p>
              <m.icon
                className={cn("size-4 shrink-0", m.positive ? "text-mint" : "text-muted-foreground")}
              />
            </div>
            <p
              className={cn(
                "mt-4 font-mono text-3xl font-bold tracking-tight",
                m.positive ? "text-mint" : "text-foreground",
              )}
            >
              {m.value}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {m.up ? (
                <ArrowUpRight className="size-3.5 text-mint" />
              ) : (
                <ArrowDownRight className="size-3.5 text-mint" />
              )}
              <span className="font-semibold text-mint">{m.delta}</span>
              <span className="text-muted-foreground">vs last cycle</span>
            </div>
          </Card>
        ))}
      </section>

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
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputSeries} margin={{ left: -20, right: 8, top: 8 }}>
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
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5">
          <h2 className="text-sm font-bold tracking-tight">Project Health</h2>
          <p className="text-xs text-muted-foreground">v_project_health</p>
          <div className="mt-5 space-y-5">
            {projectHealth.map((p) => (
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
            ))}
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold tracking-tight">Active Board</h2>
          <p className="text-xs text-muted-foreground">Live snapshot from tasks</p>
        </div>
        <KanbanBoard />
      </section>
    </div>
  );
}
