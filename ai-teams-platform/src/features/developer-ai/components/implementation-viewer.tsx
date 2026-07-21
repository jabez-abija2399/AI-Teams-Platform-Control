import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ImplementationReport } from '@/ai/agents/roles/developer/developer.types';
import { Badge } from '@/components/ui/badge';

export function ImplementationViewer({ report }: { report: ImplementationReport }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">Implementation Report</CardTitle>
        <Badge variant={report.completed ? 'default' : 'secondary'}>
          {report.completed ? 'Completed' : 'Incomplete'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">{report.notes}</p>
        {report.issues.length > 0 && (
          <div>
            <p className="text-muted-foreground text-xs">Issues</p>
            <ul className="list-inside list-disc text-sm text-red-500">
              {report.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
