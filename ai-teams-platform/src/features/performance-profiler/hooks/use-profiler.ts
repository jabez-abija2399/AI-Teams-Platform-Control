'use client';

import { useMutation } from '@tanstack/react-query';

async function analyzeProject(projectId: string) {
  const res = await fetch(`/api/ai/profiler`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  if (!res.ok) throw new Error('Failed to analyze project');
  return res.json();
}

export function useProfiler() {
  return useMutation({
    mutationFn: ({ projectId }: { projectId: string }) => analyzeProject(projectId),
  });
}
