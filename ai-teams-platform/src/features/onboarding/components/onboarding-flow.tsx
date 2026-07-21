'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useOnboardingStore } from '../stores/onboarding.store';
import { IdeaPrompt } from './idea-prompt';
import { TeamAssembling } from './team-assembling';

export function OnboardingFlow() {
  const router = useRouter();
  const { step, setStep, setIdea } = useOnboardingStore();

  async function handleSubmit(idea: string) {
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

    // Fire the real CEO AI call in parallel with the visual sequence above —
    // by the time the ~4.2s staged animation finishes, the real result is
    // very likely ready, so the "ready" step transition feels earned, not fake.
    fetch('/api/ai/ceo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIdea: idea, projectId: projectResult.data.id }),
    }).catch(() => {
      // Failure surfaces once they land in the workspace, via its own error state —
      // not blocking the onboarding transition on it.
    });

    useOnboardingStore.getState().setProjectId(projectResult.data.id);
  }

  function handleAssemblingDone() {
    const projectId = useOnboardingStore.getState().projectId;
    if (projectId) router.push(`/dashboard/projects/${projectId}/workspace`);
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      {step === 'idea' && <IdeaPrompt onSubmit={handleSubmit} />}
      {step === 'watching' && <TeamAssembling onDone={handleAssemblingDone} />}
    </div>
  );
}
