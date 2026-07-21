'use client';

import { useQuery } from '@tanstack/react-query';
import type { QualityMetrics } from '@/features/quality-engine/types';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function useQualityMetrics(projectId: string) {
  return useQuery<QualityMetrics>({
    queryKey: ['quality-metrics', projectId],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/quality/metrics`),
    enabled: !!projectId,
  });
}
