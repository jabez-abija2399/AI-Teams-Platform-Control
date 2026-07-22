'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TechnicalArchitecture } from '@/ai/agents/roles/architect/architect.types';
import { SmartValue } from './smart-value';

const SECTIONS: { key: keyof TechnicalArchitecture; label: string }[] = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'database', label: 'Database' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'security', label: 'Security' },
];

export function SystemDiagram({ architecture }: { architecture: TechnicalArchitecture }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">System Architecture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {SECTIONS.map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">{label}</p>
            <SmartValue value={architecture[key]} className="pl-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
