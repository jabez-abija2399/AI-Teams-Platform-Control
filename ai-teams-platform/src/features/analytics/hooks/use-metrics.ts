'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MetricInfo, MetricTimeSeries } from '@/features/analytics/types';
import type { RecordMetricInput } from '@/features/analytics/schemas/analytics.schema';
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

export function useMetrics(projectId: string, category?: string, since?: string) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (since) params.set('since', since);
  const query = params.toString() ? `?${params.toString()}` : '';

  return useQuery<MetricInfo[]>({
    queryKey: ['analytics-metrics', projectId, category, since],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/analytics/metrics${query}`),
    enabled: !!projectId,
  });
}

export function useRecordMetric(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordMetricInput) =>
      mutateJSON<MetricInfo>(`/api/projects/${projectId}/analytics/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['analytics-metrics', projectId] }),
  });
}

export function useMetricTimeSeries(projectId: string, name: string, days?: number) {
  const params = days ? `?days=${days}` : '';
  return useQuery<MetricTimeSeries>({
    queryKey: ['analytics-metric-timeseries', projectId, name, days],
    queryFn: () =>
      fetchJSON(
        `/api/projects/${projectId}/analytics/metrics/${encodeURIComponent(name)}/timeseries${params}`,
      ),
    enabled: !!projectId && !!name,
  });
}

export function useMetricsByCategory(projectId: string) {
  return useQuery<Record<string, MetricInfo[]>>({
    queryKey: ['analytics-metrics-by-category', projectId],
    queryFn: () =>
      fetchJSON(`/api/projects/${projectId}/analytics/metrics/by-category`),
    enabled: !!projectId,
  });
}
