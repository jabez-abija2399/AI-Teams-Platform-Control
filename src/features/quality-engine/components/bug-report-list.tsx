'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Bug, Trash2, ExternalLink } from 'lucide-react';
import { useBugReports, useDeleteBugReport } from '@/features/quality-engine/hooks/use-bug-reports';
import type { BugReportInfo } from '@/features/quality-engine/types';

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-blue-100 text-blue-800',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-red-50 text-red-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  RESOLVED: 'bg-green-50 text-green-700',
  CLOSED: 'bg-gray-50 text-gray-700',
};

function BugRow({
  bug,
  onDelete,
}: {
  bug: BugReportInfo;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border px-3 py-2 space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={SEVERITY_STYLES[bug.severity] ?? 'bg-gray-100 text-gray-800'}>
            {bug.severity}
          </Badge>
          <Badge className={STATUS_STYLES[bug.status] ?? 'bg-gray-100 text-gray-800'}>
            {bug.status}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {bug.file && (
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {bug.file}{bug.line ? `:${bug.line}` : ''}
            </span>
          )}
          <Button variant="ghost" size="icon-xs" onClick={onDelete} title="Delete bug report">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <p className="text-sm font-medium">{bug.title}</p>
      <p className="text-muted-foreground text-xs line-clamp-2">{bug.description}</p>
      {bug.solution && (
        <p className="text-green-700 text-xs">Solution: {bug.solution}</p>
      )}
    </div>
  );
}

export function BugReportList({ projectId }: { projectId: string }) {
  const { data: bugs, isLoading } = useBugReports(projectId);
  const deleteMutation = useDeleteBugReport(projectId);

  if (isLoading) return <Loading label="Loading bug reports..." />;

  const items = bugs ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Bug Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={Bug}
            title="No bug reports"
            description="No bugs have been reported for this project."
          />
        ) : (
          <div className="space-y-3">
            {items.map((bug) => (
              <BugRow
                key={bug.id}
                bug={bug}
                onDelete={() => deleteMutation.mutate(bug.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
