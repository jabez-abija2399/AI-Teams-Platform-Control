import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DeveloperPlan } from '@/ai/agents/roles/developer/developer.types';

export function CodeTaskViewer({ plan }: { plan: DeveloperPlan }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Development Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-muted-foreground text-xs">Tasks</p>
          <ul className="list-inside list-disc text-sm">
            {plan.tasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Files to modify</p>
          <div className="flex flex-wrap gap-1">
            {plan.files.map((f) => (
              <Badge key={f} variant="secondary">
                {f}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
