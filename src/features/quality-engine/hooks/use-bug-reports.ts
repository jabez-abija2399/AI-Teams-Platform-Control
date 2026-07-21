'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BugReportInfo } from '@/features/quality-engine/types';
import type { CreateBugReportInput, BugReportFilter } from '@/features/quality-engine/schemas/quality.schema';
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

export function useBugReports(projectId: string, filter?: BugReportFilter) {
  const params = new URLSearchParams();
  if (filter?.severity) params.set('severity', filter.severity);
  if (filter?.status) params.set('status', filter.status);
  const query = params.toString() ? `?${params.toString()}` : '';

  return useQuery<BugReportInfo[]>({
    queryKey: ['bug-reports', projectId, filter],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/bugs${query}`),
    enabled: !!projectId,
  });
}

export function useCreateBugReport(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBugReportInput) =>
      mutateJSON<BugReportInfo>(`/api/projects/${projectId}/bugs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bug-reports', projectId] }),
  });
}

export function useUpdateBugStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bugId, status, solution }: { bugId: string; status: string; solution?: string }) =>
      mutateJSON<BugReportInfo>(`/api/projects/${projectId}/bugs/${bugId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, solution }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bug-reports', projectId] }),
  });
}

export function useDeleteBugReport(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bugId: string) =>
      mutateJSON<void>(`/api/projects/${projectId}/bugs/${bugId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bug-reports', projectId] }),
  });
}
