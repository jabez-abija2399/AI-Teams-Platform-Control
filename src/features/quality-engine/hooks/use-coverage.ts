'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CoverageReportInfo, CoverageFile } from '@/features/quality-engine/types';
import type { ApiResult } from '@/types/common.types';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

async function mutateJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json() as ApiResult<T>;
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function useLatestCoverage(projectId: string) {
  return useQuery<CoverageReportInfo | null>({
    queryKey: ['coverage-latest', projectId],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/coverage/latest`),
    enabled: !!projectId,
  });
}

export function useCoverageHistory(projectId: string, limit = 10) {
  return useQuery<CoverageReportInfo[]>({
    queryKey: ['coverage-history', projectId, limit],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/coverage/history?limit=${limit}`),
    enabled: !!projectId,
  });
}

export function useGenerateCoverage(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (files: CoverageFile[]) =>
      mutateJSON<CoverageReportInfo>(`/api/projects/${projectId}/coverage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coverage-latest', projectId] });
      queryClient.invalidateQueries({ queryKey: ['coverage-history', projectId] });
    },
  });
}
