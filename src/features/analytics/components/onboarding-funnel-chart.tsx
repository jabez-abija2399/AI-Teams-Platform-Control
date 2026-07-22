import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OnboardingFunnel } from '@/features/onboarding/services/onboarding-analytics.service';

const STAGES: { key: keyof OnboardingFunnel; label: string }[] = [
  { key: 'ideaSubmitted', label: 'Idea submitted' },
  { key: 'watchingComplete', label: 'Watched team assemble' },
  { key: 'buildClicked', label: 'Clicked "Build it"' },
  { key: 'buildCompleted', label: 'Build completed' },
];

export function OnboardingFunnelChart({ funnel }: { funnel: OnboardingFunnel }) {
  const max = funnel.ideaSubmitted || 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Onboarding funnel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {STAGES.map((s) => (
          <div key={s.key}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{s.label}</span>
              <span className="text-muted-foreground">{funnel[s.key]}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${(funnel[s.key] / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
