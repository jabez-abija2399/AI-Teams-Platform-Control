'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TechnicalArchitecture } from '@/ai/agents/roles/architect/architect.types';

export function SystemDiagram({ architecture }: { architecture: TechnicalArchitecture }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">System Architecture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Frontend</p>
            <p>{architecture.frontend}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Backend</p>
            <p>{architecture.backend}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Database</p>
            <p>{architecture.database}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Infrastructure</p>
            <p>{architecture.infrastructure}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Security</p>
            <p>{architecture.security}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
