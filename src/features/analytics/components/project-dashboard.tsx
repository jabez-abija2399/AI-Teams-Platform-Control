'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { useDashboard } from '@/features/analytics/hooks/use-dashboard';
import { HealthScore } from '@/features/analytics/components/health-score';
import { EventTimeline } from '@/features/analytics/components/event-timeline';
import { MetricChart } from '@/features/analytics/components/metric-chart';
import { Activity, TrendingUp, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
      <div className={cn('rounded-md p-1.5', color ?? 'bg-muted')}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xl font-semibold leading-tight">{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  );
}

function BarSegment({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="bg-muted h-2 w-full rounded-full overflow-hidden">
        <div
          className="bg-primary h-full rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ProjectDashboard({ projectId }: { projectId: string }) {
  const { data: dashboard, isLoading } = useDashboard(projectId);

  if (isLoading) return <Loading label="Loading analytics..." />;

  if (!dashboard) return null;

  const categories = Object.keys(dashboard.metricsByCategory);
  const firstCat = categories.length > 0 ? categories[0] : undefined;
  const firstCatMetrics = firstCat ? dashboard.metricsByCategory[firstCat] : undefined;
  const firstMetricName = firstCatMetrics && firstCatMetrics.length > 0
    ? firstCatMetrics[0]!.name
    : undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Total Events"
          value={dashboard.totalEvents}
          icon={Activity}
          color="bg-blue-100"
        />
        <StatCard
          label="Event Types"
          value={Object.keys(dashboard.eventsByType).length}
          icon={FolderOpen}
          color="bg-purple-100"
        />
      </div>

      <HealthScore projectId={projectId} />

      {Object.keys(dashboard.eventsByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Events by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(dashboard.eventsByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <BarSegment
                  key={type}
                  label={type}
                  count={count}
                  total={dashboard.totalEvents}
                />
              ))}
          </CardContent>
        </Card>
      )}

      {firstMetricName && (
        <MetricChart
          projectId={projectId}
          metricName={firstMetricName}
          days={14}
          label="Metric Trend"
        />
      )}

      {categories.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              <TrendingUp className="mr-1 inline h-4 w-4" />
              Metrics by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories.map((cat) => {
              const catMetrics = dashboard.metricsByCategory[cat]!;
              const latest = catMetrics[0];
              return (
                <div key={cat} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{cat}</p>
                    {latest && (
                      <p className="text-muted-foreground text-xs">
                        {latest.name}: {latest.value}
                      </p>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {catMetrics.length} point{catMetrics.length !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <EventTimeline projectId={projectId} />
    </div>
  );
}
