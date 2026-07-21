'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IdeaPrompt } from '@/features/onboarding/components/idea-prompt';

export function EmptyProjectPrompt() {
  const router = useRouter();

  async function handleSubmit(idea: string) {
    const projectRes = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: idea.slice(0, 60) }),
    });
    const projectResult = await projectRes.json();
    if (!projectResult.success) {
      toast.error(projectResult.error.message);
      return;
    }

    fetch('/api/ai/ceo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIdea: idea, projectId: projectResult.data.id }),
    }).catch(() => {});

    router.push(`/dashboard/projects/${projectResult.data.id}/workspace`);
  }

  return <IdeaPrompt onSubmit={handleSubmit} />;
}
