import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { individualPerformance, initialsOf } from "@/lib/mock-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "HR Analytics — CodOps" },
      {
        name: "description",
        content:
          "Individual performance evaluation: on-time completion rate, throughput and overdue load.",
      },
      { property: "og:title", content: "HR Analytics — CodOps" },
      {
        property: "og:description",
        content: "Evaluate on-time completion, throughput and overdue load per person.",
      },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const chartData = individualPerformance.map((p) => ({
    name: (p.full_name ?? p.email).split(" ")[0],
    rate: p.on_time_completion_rate_pct ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="HR Analytics"
        subtitle="Evaluation signals derived from v_individual_performance."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl border-border bg-card p-5">
          <h2 className="text-sm font-bold tracking-tight">On-Time Completion Rate</h2>
          <p className="text-xs text-muted-foreground">Percentage per team member</p>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="rate" radius={[8, 8, 0, 0]} maxBarSize={54}>
                  {chartData.map((d) => (
                    <Cell key={d.name} fill={d.rate >= 85 ? "var(--mint)" : "var(--primary)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl border-border bg-card p-5">
          <h2 className="text-sm font-bold tracking-tight">Individual Evaluation</h2>
          <p className="text-xs text-muted-foreground">Assigned, completed and overdue load</p>
          <div className="mt-5 space-y-5">
            {individualPerformance.map((p) => (
              <div key={p.user_id} className="min-w-0">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/20 text-[10px] font-bold text-primary">
                    {initialsOf(p.full_name ?? p.email)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{p.full_name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {p.completed_tasks}/{p.total_assigned_tasks} completed · {p.overdue_tasks}{" "}
                      overdue
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-sm font-bold text-mint">
                    {p.on_time_completion_rate_pct}%
                  </span>
                </div>
                <Progress value={p.on_time_completion_rate_pct ?? 0} className="mt-2 h-1.5" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
