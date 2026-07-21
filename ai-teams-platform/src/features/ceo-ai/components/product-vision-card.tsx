import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProductVision } from '@/ai/agents/roles/ceo/ceo.types';

export function ProductVisionCard({ vision }: { vision: ProductVision }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Product Vision</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Problem</p>
          <p className="text-sm">{vision.problem}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Solution</p>
          <p className="text-sm">{vision.solution}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Target Users</p>
          <div className="flex flex-wrap gap-1">
            {vision.targetUsers.map((u) => (
              <Badge key={u} variant="secondary">
                {u}
              </Badge>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Business Goal</p>
          <p className="text-sm">{vision.businessGoal}</p>
        </div>
      </CardContent>
    </Card>
  );
}
