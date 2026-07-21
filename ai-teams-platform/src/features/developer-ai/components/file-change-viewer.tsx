import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CodeChange } from '@/ai/agents/roles/developer/developer.types';

const CHANGE_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  MODIFY: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
};

export function FileChangeViewer({ changes }: { changes: CodeChange[] }) {
  if (!changes.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Code Changes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {changes.map((c, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <code className="text-xs">{c.file}</code>
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${CHANGE_COLORS[c.changeType] ?? ''}`}
              >
                {c.changeType}
              </span>
            </div>
            <p className="text-muted-foreground text-xs">{c.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
