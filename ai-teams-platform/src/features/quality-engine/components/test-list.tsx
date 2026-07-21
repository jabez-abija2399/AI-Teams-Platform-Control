'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { FlaskConical, Play, Trash2 } from 'lucide-react';
import { useTestCases, useExecuteTest, useDeleteTestCase } from '@/features/quality-engine/hooks/use-test-cases';
import type { TestCaseInfo } from '@/features/quality-engine/types';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  RUNNING: 'bg-blue-100 text-blue-800',
  PASSED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  SKIPPED: 'bg-yellow-100 text-yellow-800',
};

function TestRow({
  test,
  onExecute,
  onDelete,
  isExecuting,
}: {
  test: TestCaseInfo;
  onExecute: () => void;
  onDelete: () => void;
  isExecuting: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Badge className={STATUS_STYLES[test.status] ?? 'bg-gray-100 text-gray-800'}>
          {test.status}
        </Badge>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{test.name}</p>
          <p className="text-muted-foreground text-xs truncate">{test.framework} &middot; {test.file}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {test.executionCount > 0 && (
          <span className="text-muted-foreground text-xs">
            {test.executionCount} run{test.executionCount !== 1 ? 's' : ''}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onExecute}
          disabled={isExecuting}
          title="Run test"
        >
          <Play className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onDelete}
          title="Delete test"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function TestList({ projectId }: { projectId: string }) {
  const { data: tests, isLoading } = useTestCases(projectId);
  const executeMutation = useExecuteTest(projectId);
  const deleteMutation = useDeleteTestCase(projectId);

  if (isLoading) return <Loading label="Loading tests..." />;

  const items = tests ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No test cases"
            description="Create test cases to start tracking quality."
          />
        ) : (
          <div className="space-y-2">
            {items.map((test) => (
              <TestRow
                key={test.id}
                test={test}
                isExecuting={executeMutation.isPending}
                onExecute={() => executeMutation.mutate(test.id)}
                onDelete={() => deleteMutation.mutate(test.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
