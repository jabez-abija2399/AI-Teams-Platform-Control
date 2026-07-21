import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DatabaseDesign } from '@/ai/agents/roles/architect/architect.types';

export function DatabaseViewer({ database }: { database: DatabaseDesign }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Database Design</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {database.entities.map((entity) => (
          <div key={entity.name} className="space-y-1">
            <p className="text-sm font-medium">{entity.name}</p>
            <ul className="text-muted-foreground list-inside list-disc text-xs">
              {entity.fields.map((f) => (
                <li key={f.name}>
                  {f.name}: {f.type}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {database.relationships.length > 0 && (
          <div>
            <p className="text-muted-foreground text-xs">Relationships</p>
            <ul className="text-muted-foreground list-inside list-disc text-xs">
              {database.relationships.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
