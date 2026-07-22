'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useOnboardingStore } from '../stores/onboarding.store';
import { IdeaPrompt } from './idea-prompt';
import { TeamAssembling } from './team-assembling';
import { BuildItButton } from './build-it-button';

function track(projectId: string, event: string) {
  fetch('/api/onboarding/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, event }),
  }).catch(() => {});
}

export function OnboardingFlow() {
  const router = useRouter();
  const { step, setStep, setIdea } = useOnboardingStore();

  async function handleSubmit(idea: string, fromSample = false) {
    setIdea(idea);
    setStep('watching');

    const projectRes = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: idea.slice(0, 60) }),
    });
    const projectResult = await projectRes.json();
    if (!projectResult.success) {
      toast.error(projectResult.error.message);
      setStep('idea');
      return;
    }

    const projectId = projectResult.data.id;
    useOnboardingStore.getState().setProjectId(projectId);

    track(projectId, fromSample ? 'onboarding.sample_selected' : 'onboarding.idea_submitted');
  }

  function handleAssemblingDone() {
    const projectId = useOnboardingStore.getState().projectId;
    if (projectId) track(projectId, 'onboarding.watching_complete');
    setStep('build-prompt');
  }

  function handleSkipBuild() {
    const projectId = useOnboardingStore.getState().projectId;
    if (projectId) {
      track(projectId, 'onboarding.build_skipped');
      router.push(`/dashboard/projects/${projectId}/workspace`);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      {step === 'idea' && <IdeaPrompt onSubmit={handleSubmit} />}
      {step === 'watching' && <TeamAssembling onDone={handleAssemblingDone} />}
      {step === 'build-prompt' && (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            CEO and Architect AI have a plan ready.
          </p>
          <BuildItButton
            projectId={useOnboardingStore.getState().projectId!}
            idea={useOnboardingStore.getState().idea}
          />
          <button onClick={handleSkipBuild} className="block w-full text-xs text-muted-foreground underline">
            Skip — I&apos;ll review the plan first
          </button>
        </div>
      )}
    </div>
  );
}
