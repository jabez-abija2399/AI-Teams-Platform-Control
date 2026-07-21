'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { TestCaseInfo, TestExecutionInfo } from '@/features/quality-engine/types';
import type { CreateTestCaseInput, TestCaseFilter } from '@/features/quality-engine/schemas/quality.schema';
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

export function useTestCases(projectId: string, filter?: TestCaseFilter) {
  const params = new URLSearchParams();
  if (filter?.status) params.set('status', filter.status);
  if (filter?.type) params.set('type', filter.type);
  if (filter?.framework) params.set('framework', filter.framework);
  const query = params.toString() ? `?${params.toString()}` : '';

  return useQuery<TestCaseInfo[]>({
    queryKey: ['test-cases', projectId, filter],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/tests${query}`),
    enabled: !!projectId,
  });
}

export function useCreateTestCase(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTestCaseInput) =>
      mutateJSON<TestCaseInfo>(`/api/projects/${projectId}/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases', projectId] }),
  });
}

export function useDeleteTestCase(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) =>
      mutateJSON<void>(`/api/projects/${projectId}/tests/${testId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases', projectId] }),
  });
}

export function useExecuteTest(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) =>
      mutateJSON<TestExecutionInfo>(`/api/projects/${projectId}/tests/${testId}/execute`, {
        method: 'POST',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases', projectId] }),
  });
}

export function useTestExecutions(testId: string, limit?: number) {
  return useQuery<TestExecutionInfo[]>({
    queryKey: ['test-executions', testId, limit],
    queryFn: () => {
      const params = limit ? `?limit=${limit}` : '';
      return fetchJSON(`/api/tests/${testId}/executions${params}`);
    },
    enabled: !!testId,
  });
}
