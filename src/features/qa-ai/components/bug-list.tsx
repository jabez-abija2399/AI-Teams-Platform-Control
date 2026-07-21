import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BugReport } from '@/ai/agents/roles/qa/qa.types';

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  LOW: 'bg-blue-100 text-blue-800',
};

export function BugList({ bugs }: { bugs: BugReport[] }) {
  if (!bugs.length) return <p className="text-muted-foreground text-sm">No issues found.</p>;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bugs.map((bug, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={SEVERITY_COLORS[bug.severity]}>{bug.severity}</Badge>
              <code className="text-xs">{bug.location}</code>
            </div>
            <p className="text-sm">{bug.description}</p>
            <p className="text-muted-foreground text-xs">Fix: {bug.solution}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
