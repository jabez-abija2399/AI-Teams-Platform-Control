'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { useMetricTimeSeries } from '@/features/analytics/hooks/use-metrics';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

function getBarColor(value: number, max: number): string {
  if (max === 0) return 'bg-muted';
  const pct = (value / max) * 100;
  if (pct >= 80) return 'bg-green-500';
  if (pct >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

interface MetricChartProps {
  projectId: string;
  metricName: string;
  days?: number;
  label?: string;
}

export function MetricChart({ projectId, metricName, days = 14, label }: MetricChartProps) {
  const { data: timeSeries, isLoading } = useMetricTimeSeries(projectId, metricName, days);

  if (isLoading) return <Loading label="Loading chart..." />;

  const series = timeSeries?.data ?? [];
  const max = series.reduce((m, d) => Math.max(m, d.value), 0);
  const avg =
    series.length > 0
      ? series.reduce((sum, d) => sum + d.value, 0) / series.length
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {label ?? metricName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {series.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No metric data"
            description={`No data points for "${metricName}" yet.`}
          />
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{avg.toFixed(1)}</span>
              <span className="text-muted-foreground text-xs">avg over {days} days</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-end gap-1" style={{ height: 80 }}>
                {series.map((point) => {
                  const height = max > 0 ? (point.value / max) * 100 : 0;
                  return (
                    <div
                      key={point.date}
                      className="group relative flex-1"
                      style={{ height: '100%' }}
                    >
                      <div className="absolute inset-x-0 bottom-0 flex justify-center">
                        <div
                          className={cn(
                            'w-full max-w-[24px] rounded-t transition-all',
                            getBarColor(point.value, max),
                          )}
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                      </div>
                      <div className="absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white group-hover:block">
                        {point.value}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {series[0]?.date
                    ? new Date(series[0].date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : ''}
                </span>
                <span>
                  {series.length > 1
                    ? new Date(series[series.length - 1]!.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : ''}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
