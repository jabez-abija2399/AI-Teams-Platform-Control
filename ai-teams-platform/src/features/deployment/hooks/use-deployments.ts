'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DeploymentInfo, DeploymentStepInfo, DeploymentLogEntry, DeployInput } from '@/features/deployment/types';
import type { DeploymentFilter } from '@/features/deployment/schemas/deployment.schema';
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

export function useDeployments(projectId: string, filter?: DeploymentFilter) {
  const params = new URLSearchParams();
  if (filter?.environmentId) params.set('environmentId', filter.environmentId);
  if (filter?.status) params.set('status', filter.status);
  const query = params.toString() ? `?${params.toString()}` : '';

  return useQuery<DeploymentInfo[]>({
    queryKey: ['deployments', projectId, filter],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/deployments${query}`),
    enabled: !!projectId,
  });
}

export function useDeployment(deploymentId: string) {
  return useQuery<DeploymentInfo>({
    queryKey: ['deployment', deploymentId],
    queryFn: () => fetchJSON(`/api/deployments/${deploymentId}`),
    enabled: !!deploymentId,
  });
}

export function useDeploymentSteps(deploymentId: string) {
  return useQuery<DeploymentStepInfo[]>({
    queryKey: ['deployment-steps', deploymentId],
    queryFn: () => fetchJSON(`/api/deployments/${deploymentId}/steps`),
    enabled: !!deploymentId,
  });
}

export function useDeploymentLogs(deploymentId: string) {
  return useQuery<DeploymentLogEntry[]>({
    queryKey: ['deployment-logs', deploymentId],
    queryFn: () => fetchJSON(`/api/deployments/${deploymentId}/logs`),
    enabled: !!deploymentId,
  });
}

export function useCreateDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeployInput) =>
      mutateJSON<DeploymentInfo>(`/api/projects/${input.projectId}/deployments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deployments', variables.projectId] });
    },
  });
}

export function useExecuteDeployment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deploymentId: string) =>
      mutateJSON<DeploymentInfo>(`/api/deployments/${deploymentId}/execute`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deployments', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['deployment', data.id] });
      queryClient.invalidateQueries({ queryKey: ['deployment-steps', data.id] });
      queryClient.invalidateQueries({ queryKey: ['deployment-logs', data.id] });
    },
  });
}
