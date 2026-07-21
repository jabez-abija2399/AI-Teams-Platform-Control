import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TechnologyDecision } from '@/ai/agents/roles/architect/architect.types';

export function TechnologyDecisionCard({ decisions }: { decisions: TechnologyDecision[] }) {
  if (!decisions.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Technology Decisions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {decisions.map((d, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{d.technology}</p>
              <Badge variant="secondary">vs {d.alternative}</Badge>
            </div>
            <p className="text-muted-foreground text-xs">{d.reason}</p>
            <p className="text-muted-foreground text-xs">Tradeoff: {d.tradeoff}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
