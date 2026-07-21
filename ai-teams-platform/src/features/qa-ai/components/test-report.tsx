import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TestPlan } from '@/ai/agents/roles/qa/qa.types';
import { Badge } from '@/components/ui/badge';

export function TestReport({ testPlan }: { testPlan: TestPlan }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Test Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">{testPlan.strategy}</p>
        <div>
          <p className="text-muted-foreground text-xs">Coverage: {testPlan.coverage}</p>
        </div>
        <div className="space-y-2">
          {testPlan.tests.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Badge variant="outline">{t.type}</Badge>
              <span>{t.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
