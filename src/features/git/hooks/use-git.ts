'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResult } from '@/types/common.types';
import type {
  GitRepository,
  GitBranchInfo,
  GitCommitInfo,
  GitChangeInfo,
  GitDiff,
  GitStatus,
  GitCreateCommitInput,
} from '../types';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json: ApiResult<T> = await res.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function useGitRepository(projectId: string | null) {
  return useQuery({
    queryKey: ['git', 'repository', projectId],
    queryFn: () => fetchJSON<GitRepository | null>(`/api/git?projectId=${projectId}`),
    enabled: !!projectId,
  });
}

export function useCreateRepository() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { projectId: string; path: string }) =>
      fetchJSON<GitRepository>('/api/git/repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['git', 'repository', variables.projectId] });
    },
  });
}

export function useGitBranches(repositoryId: string | null) {
  return useQuery({
    queryKey: ['git', 'branches', repositoryId],
    queryFn: () => fetchJSON<GitBranchInfo[]>(`/api/git/branches?repositoryId=${repositoryId}`),
    enabled: !!repositoryId,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { repositoryId: string; name: string; type?: string }) =>
      fetchJSON<GitBranchInfo>('/api/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['git', 'branches', variables.repositoryId] });
    },
  });
}

export function useDeleteBranch(repositoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchId: string) =>
      fetchJSON<void>(`/api/git/branches/${branchId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git', 'branches', repositoryId] });
    },
  });
}

export function useSwitchBranch(repositoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (branchId: string) =>
      fetchJSON<void>('/api/git/branches/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repositoryId, branchId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git', 'branches', repositoryId] });
      queryClient.invalidateQueries({ queryKey: ['git', 'repository'] });
    },
  });
}

export function useGitCommits(
  repositoryId: string | null,
  branchId?: string,
  limit?: number,
) {
  const params = new URLSearchParams();
  if (repositoryId) params.set('repositoryId', repositoryId);
  if (branchId) params.set('branchId', branchId);
  if (limit) params.set('limit', String(limit));

  return useQuery({
    queryKey: ['git', 'commits', repositoryId, branchId, limit],
    queryFn: () => fetchJSON<GitCommitInfo[]>(`/api/git/commits?${params.toString()}`),
    enabled: !!repositoryId,
  });
}

export function useGitCommit(commitId: string | null) {
  return useQuery({
    queryKey: ['git', 'commit', commitId],
    queryFn: () => fetchJSON<GitCommitInfo>(`/api/git/commits/${commitId}`),
    enabled: !!commitId,
  });
}

export function useGitChanges(commitId: string | null) {
  return useQuery({
    queryKey: ['git', 'changes', commitId],
    queryFn: () => fetchJSON<GitChangeInfo[]>(`/api/git/commits/${commitId}/changes`),
    enabled: !!commitId,
  });
}

export function useCreateCommit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GitCreateCommitInput) =>
      fetchJSON<GitCommitInfo>('/api/git/commits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['git', 'commits', variables.repositoryId] });
      queryClient.invalidateQueries({ queryKey: ['git', 'branches', variables.repositoryId] });
    },
  });
}

export function useGitDiff(commitId: string | null) {
  return useQuery({
    queryKey: ['git', 'diff', commitId],
    queryFn: () => fetchJSON<GitDiff[]>(`/api/git/diff?commitId=${commitId}`),
    enabled: !!commitId,
  });
}

export function useGitStatus(repositoryId: string | null) {
  return useQuery({
    queryKey: ['git', 'status', repositoryId],
    queryFn: () => fetchJSON<GitStatus>(`/api/git/status?repositoryId=${repositoryId}`),
    enabled: !!repositoryId,
    refetchInterval: 5000,
  });
}
