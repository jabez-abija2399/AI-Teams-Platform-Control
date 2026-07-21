'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { DocPage, DocVersion } from '../types';
import type { CreateDocumentInput, UpdateDocumentInput } from '../schemas/documentation.schema';
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

export function useDocuments(projectId: string, type?: string) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  const query = params.toString() ? `?${params.toString()}` : '';

  return useQuery<DocPage[]>({
    queryKey: ['documents', projectId, type],
    queryFn: () => fetchJSON(`/api/projects/${projectId}/docs${query}`),
    enabled: !!projectId,
  });
}

export function useDocument(docId: string) {
  return useQuery<DocPage>({
    queryKey: ['document', docId],
    queryFn: () => fetchJSON(`/api/docs/${docId}`),
    enabled: !!docId,
  });
}

export function useCreateDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDocumentInput) =>
      mutateJSON<DocPage>(`/api/projects/${projectId}/docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', projectId] }),
  });
}

export function useUpdateDocument(projectId: string, docId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDocumentInput) =>
      mutateJSON<DocPage>(`/api/docs/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['document', docId] });
    },
  });
}

export function useDeleteDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) =>
      mutateJSON<void>(`/api/docs/${docId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', projectId] }),
  });
}

export function useDocumentVersions(docId: string) {
  return useQuery<DocVersion[]>({
    queryKey: ['document-versions', docId],
    queryFn: () => fetchJSON(`/api/docs/${docId}/versions`),
    enabled: !!docId,
  });
}

export function useRevertToVersion(projectId: string, docId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) =>
      mutateJSON<DocPage>(`/api/docs/${docId}/revert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['document', docId] });
      queryClient.invalidateQueries({ queryKey: ['document-versions', docId] });
    },
  });
}
