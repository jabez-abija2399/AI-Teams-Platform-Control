'use client';

import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThinkingSteps } from './thinking-steps';
import { useRouter } from 'next/navigation';

const BUILD_STEPS = [
  { label: 'Finalizing requirements' },
  { label: 'Designing architecture' },
  { label: 'Writing code' },
  { label: 'Testing everything' },
  { label: 'Checking for issues' },
  { label: 'Deploying' },
];

export function BuildItButton({ projectId, idea }: { projectId: string; idea: string }) {
  const router = useRouter();
  const [building, setBuilding] = useState(false);
  const [done, setDone] = useState(false);

  async function handleBuild() {
    fetch('/api/onboarding/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, event: 'onboarding.build_clicked' }),
    }).catch(() => {});

    setBuilding(true);
    await fetch('/api/onboarding/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, idea }),
    });

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const result = await res.json();
        if (result.success && result.data.status !== 'PLANNING') {
          clearInterval(poll);
          setDone(true);
        }
      } catch {
        // continue polling
      }
    }, 3000);

    setTimeout(() => clearInterval(poll), 180_000);
  }

  if (building) {
    return (
      <div className="space-y-4">
        <ThinkingSteps steps={BUILD_STEPS} intervalMs={4000} />
        {done && (
          <div className="text-center">
            <Button onClick={() => router.push(`/dashboard/projects/${projectId}/workspace`)}>
              Open your app
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button size="lg" onClick={handleBuild} className="gap-2">
      <Rocket className="h-4 w-4" /> Build it
    </Button>
  );
}
