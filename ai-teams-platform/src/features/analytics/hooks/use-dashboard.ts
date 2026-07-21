'use client';

import { useQuery } from '@tanstack/react-query';
import type { AnalyticsDashboard } from '@/features/analytics/types';

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function useDashboard(projectId: string) {
  return useQuery<AnalyticsDashboard>({
    queryKey: ['analytics-dashboard', projectId],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/analytics/dashboard`),
    enabled: !!projectId,
  });
}
