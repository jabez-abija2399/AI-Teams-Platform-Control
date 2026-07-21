'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { KnowledgeEntry } from '../types';
import type { CreateKnowledgeInput } from '../schemas/documentation.schema';
import type { ApiResult } from '@/types/common.types';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
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

export function useKnowledgeList(projectId: string, limit?: number) {
  const params = limit ? `?limit=${limit}` : '';

  return useQuery<KnowledgeEntry[]>({
    queryKey: ['knowledge', projectId, limit],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/knowledge${params}`),
    enabled: !!projectId,
  });
}

export function useKnowledgeSearch(projectId: string, query: string) {
  const params = query ? `?q=${encodeURIComponent(query)}` : '';

  return useQuery<KnowledgeEntry[]>({
    queryKey: ['knowledge-search', projectId, query],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/knowledge/search${params}`),
    enabled: !!projectId && query.length > 0,
  });
}

export function useRecordKnowledge(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateKnowledgeInput) =>
      mutateJSON<KnowledgeEntry>(`/api/projects/${projectId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge', projectId] }),
  });
}

export function useDeleteKnowledge(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (knowledgeId: string) =>
      mutateJSON<void>(`/api/knowledge/${knowledgeId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge', projectId] }),
  });
}
