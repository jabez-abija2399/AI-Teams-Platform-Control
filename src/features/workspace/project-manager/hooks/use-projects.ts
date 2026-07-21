'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectInput } from '../schemas/project-manager.schema';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchJSON<unknown[]>('/api/projects'),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      fetchJSON<{ id: string }>('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      fetchJSON<{ favorite: boolean }>(`/api/projects/${projectId}/favorite`, {
        method: 'POST',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });
}
