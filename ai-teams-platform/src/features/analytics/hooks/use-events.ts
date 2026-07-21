'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { PlatformEventInfo } from '@/features/analytics/types';
import type { RecordEventInput, EventFilter } from '@/features/analytics/schemas/analytics.schema';
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

export function useEvents(projectId: string, filter?: EventFilter) {
  const params = new URLSearchParams();
  if (filter?.type) params.set('type', filter.type);
  if (filter?.source) params.set('source', filter.source);
  if (filter?.since) params.set('since', filter.since);
  if (filter?.limit) params.set('limit', String(filter.limit));
  const query = params.toString() ? `?${params.toString()}` : '';

  return useQuery<PlatformEventInfo[]>({
    queryKey: ['analytics-events', projectId, filter],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/analytics/events${query}`),
    enabled: !!projectId,
  });
}

export function useRecordEvent(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordEventInput) =>
      mutateJSON<PlatformEventInfo>(`/api/projects/${projectId}/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['analytics-events', projectId] }),
  });
}

export function useEventsByType(projectId: string, type: string) {
  return useQuery<PlatformEventInfo[]>({
    queryKey: ['analytics-events-by-type', projectId, type],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/analytics/events/by-type/${type}`),
    enabled: !!projectId && !!type,
  });
}

export function useEventCountsByType(projectId: string, since?: string) {
  const params = since ? `?since=${since}` : '';
  return useQuery<Record<string, number>>({
    queryKey: ['analytics-event-counts', projectId, since],
    queryFn: () =>
      fetchJSON(`/api/projects/${projectId}/analytics/events/counts${params}`),
    enabled: !!projectId,
  });
}
