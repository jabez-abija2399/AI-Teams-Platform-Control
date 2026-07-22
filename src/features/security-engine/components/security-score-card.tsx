'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { EmptyStateAction } from '@/features/onboarding/components/empty-state-action';

function getScoreColor(score: number) {
  if (score >= 80) return { ring: 'text-green-600', bg: 'bg-green-100', label: 'Good', icon: ShieldCheck };
  if (score >= 50) return { ring: 'text-amber-600', bg: 'bg-amber-100', label: 'Needs Improvement', icon: ShieldAlert };
  return { ring: 'text-red-600', bg: 'bg-red-100', label: 'At Risk', icon: ShieldX };
}

export function SecurityScoreCard({ score }: { score: number }) {
  const color = getScoreColor(score);
  const Icon = color.icon;

  if (score === 0) {
    return (
      <EmptyStateAction
        icon={Shield}
        title="No security scan yet"
        description="Run a security scan to check your project for vulnerabilities."
        agentRole="SECURITY"
        actions={[
          { label: 'Run Scan', onClick: () => {} },
        ]}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Shield className="h-4 w-4" />
          Security Score
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className={`rounded-full p-6 ${color.bg}`}>
          <div className="text-center">
            <p className={`text-3xl font-bold ${color.ring}`}>{score}</p>
            <p className="text-muted-foreground text-xs">out of 100</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color.ring}`} />
          <span className={`text-sm font-medium ${color.ring}`}>{color.label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
