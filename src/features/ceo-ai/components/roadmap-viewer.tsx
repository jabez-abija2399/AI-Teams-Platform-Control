import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DevelopmentPlan } from '@/ai/agents/roles/ceo/ceo.types';

export function RoadmapViewer({ plan }: { plan: DevelopmentPlan }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Development Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-xs">Complexity:</p>
          <Badge
            variant={
              plan.estimatedComplexity === 'VERY_HIGH' || plan.estimatedComplexity === 'HIGH'
                ? 'default'
                : 'secondary'
            }
          >
            {plan.estimatedComplexity}
          </Badge>
        </div>
        {plan.phases.map((phase, i) => (
          <div key={i} className="space-y-1">
            <p className="text-sm font-medium">{phase.name}</p>
            <p className="text-muted-foreground text-xs">{phase.goal}</p>
            <ul className="text-muted-foreground list-inside list-disc text-xs">
              {phase.tasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
