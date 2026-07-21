'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { cn } from '@/lib/utils';
import { useCoverageHistory } from '@/features/quality-engine/hooks/use-coverage';
import type { CoverageFile } from '@/features/quality-engine/types';

function getBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500';
  if (percentage >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getFileColor(file: CoverageFile): string {
  if (file.percentage >= 80) return 'bg-green-400';
  if (file.percentage >= 60) return 'bg-yellow-400';
  return 'bg-red-400';
}

function CoverageBar({ percentage, label }: { percentage: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{percentage.toFixed(1)}%</span>
      </div>
      <div className="bg-muted h-2 w-full rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', getBarColor(percentage))}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function CoverageChart({ projectId }: { projectId: string }) {
  const { data: history, isLoading } = useCoverageHistory(projectId);

  if (isLoading) return <Loading label="Loading coverage..." />;

  const reports = history ?? [];
  const latest = reports.length > 0 ? reports[0] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Code Coverage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {latest ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{latest.percentage.toFixed(1)}%</span>
              <span className="text-muted-foreground text-xs">overall</span>
            </div>

            {latest.files.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium">File Coverage</p>
                {latest.files.slice(0, 10).map((file) => (
                  <div key={file.path} className="flex items-center gap-2">
                    <div className="bg-muted h-1.5 w-1.5 rounded-full flex-shrink-0">
                      <div className={cn('h-full w-full rounded-full', getFileColor(file))} />
                    </div>
                    <span className="text-xs truncate flex-1 min-w-0">{file.path}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {file.covered}/{file.total}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {reports.length > 1 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium">History</p>
                {reports.slice(0, 7).map((report) => (
                  <CoverageBar
                    key={report.id}
                    percentage={report.percentage}
                    label={new Date(report.createdAt).toLocaleDateString()}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground text-sm">No coverage data yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
