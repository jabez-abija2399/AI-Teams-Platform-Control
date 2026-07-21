'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import { useQualityMetrics } from '@/features/quality-engine/hooks/use-quality-metrics';
import { FlaskConical, Bug, Shield, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';


function MetricCard({
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

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const bgColor = score >= 80 ? 'bg-green-100' : score >= 60 ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <div className={cn('rounded-full p-6', bgColor)}>
      <div className="text-center">
        <p className={cn('text-3xl font-bold', color)}>{score}</p>
        <p className="text-muted-foreground text-xs">Quality Score</p>
      </div>
    </div>
  );
}

export function QualityDashboard({ projectId }: { projectId: string }) {
  const { data: metrics, isLoading } = useQualityMetrics(projectId);

  if (isLoading) return <Loading label="Loading quality metrics..." />;

  if (!metrics) return null;

  const testPassRate =
    metrics.totalTests > 0
      ? Math.round((metrics.passingTests / metrics.totalTests) * 100)
      : 0;

  const qualityScore = Math.round(
    (testPassRate * 0.3 +
      metrics.coverage * 0.4 +
      (metrics.openBugs === 0 ? 100 : Math.max(0, 100 - metrics.openBugs * 10)) * 0.3),
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Quality Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center">
            <ScoreRing score={qualityScore} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricCard
              label="Total Tests"
              value={metrics.totalTests}
              icon={FlaskConical}
              color="bg-blue-100"
            />
            <MetricCard
              label="Pass Rate"
              value={`${testPassRate}%`}
              icon={CheckCircle}
              color="bg-green-100"
            />
            <MetricCard
              label="Coverage"
              value={`${metrics.coverage.toFixed(1)}%`}
              icon={Shield}
              color="bg-purple-100"
            />
            <MetricCard
              label="Avg Duration"
              value={`${metrics.avgTestDuration}ms`}
              icon={Clock}
              color="bg-orange-100"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Test Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Passing</span>
            </div>
            <span className="text-sm font-medium">{metrics.passingTests}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm">Failing</span>
            </div>
            <span className="text-sm font-medium">{metrics.failingTests}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm">Skipped</span>
            </div>
            <span className="text-sm font-medium">{metrics.skippedTests}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Bug Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Open Bugs</span>
            </div>
            <span className="text-sm font-medium">{metrics.openBugs}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-4 w-4 text-red-600" />
              <span className="text-sm">Critical Bugs</span>
            </div>
            <span className="text-sm font-medium">{metrics.criticalBugs}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
