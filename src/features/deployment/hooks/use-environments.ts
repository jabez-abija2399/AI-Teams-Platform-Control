'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { EnvironmentInfo } from '@/features/deployment/types';
import type { CreateEnvironmentInput, UpdateEnvironmentInput } from '@/features/deployment/schemas/deployment.schema';
import type { ApiResult } from '@/types/common.types';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json() as ApiResult<T>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

async function mutateJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json() as ApiResult<T>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function useEnvironments(projectId: string) {
  return useQuery<EnvironmentInfo[]>({
    queryKey: ['environments', projectId],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/environments`),
    enabled: !!projectId,
  });
}

export function useEnvironment(envId: string) {
  return useQuery<EnvironmentInfo>({
    queryKey: ['environment', envId],
    queryFn: () => fetchJSON(`/api/environments/${envId}`),
    enabled: !!envId,
  });
}

export function useCreateEnvironment(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEnvironmentInput) =>
      mutateJSON<EnvironmentInfo>(`/api/projects/${projectId}/environments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['environments', projectId] }),
  });
}

export function useUpdateEnvironment(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ envId, input }: { envId: string; input: UpdateEnvironmentInput }) =>
      mutateJSON<EnvironmentInfo>(`/api/environments/${envId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['environments', projectId] }),
  });
}

export function useDeleteEnvironment(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (envId: string) =>
      mutateJSON<void>(`/api/environments/${envId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['environments', projectId] }),
  });
}
