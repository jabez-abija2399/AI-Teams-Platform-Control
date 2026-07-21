import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProductRequirement } from '@/ai/agents/roles/ceo/ceo.types';

export function RequirementViewer({ requirements }: { requirements: ProductRequirement }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Requirements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-muted-foreground text-xs font-medium">Features</p>
          <div className="space-y-1">
            {requirements.features.map((f) => (
              <div key={f.name} className="flex items-center gap-2">
                <p className="text-sm font-medium">{f.name}</p>
                <p className="text-muted-foreground text-xs">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-xs font-medium">User Stories</p>
          <div className="space-y-1">
            {requirements.userStories.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Badge
                  variant={
                    s.priority === 'HIGH' || s.priority === 'URGENT' ? 'default' : 'secondary'
                  }
                >
                  {s.priority}
                </Badge>
                <p className="text-xs">
                  As {s.as}, I want {s.iWant}, so that {s.soThat}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
