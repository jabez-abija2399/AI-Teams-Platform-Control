'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProjectHealthInfo } from '@/features/analytics/types';
import type { ApiResult } from '@/types/common.types';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

async function mutateJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as ApiResult<T>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function useProjectHealth(projectId: string) {
  return useQuery<ProjectHealthInfo | null>({
    queryKey: ['project-health', projectId],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/analytics/health`),
    enabled: !!projectId,
  });
}

export function useCalculateHealth(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      mutateJSON<ProjectHealthInfo>(`/api/projects/${projectId}/analytics/health/calculate`, {
        method: 'POST',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project-health', projectId] }),
  });
}
