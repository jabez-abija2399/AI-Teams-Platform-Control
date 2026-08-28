'use client';

import { useEffect, useState, useCallback } from 'react';

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  artifactName: string;
}

export interface PendingDocument {
  title: string;
  type: string;
  content: any;
}

interface WorkspaceStatus {
  currentPhase: string;
  phaseStatus: 'running' | 'waiting' | 'approval' | 'failed' | 'idle';
  progress: number;
  approvalRequests: ApprovalRequest[];
  pendingDocument: PendingDocument | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom React hook to poll the project pipeline status, pending approvals,
 * and deliverables required for human-in-the-loop validation.
 */
export function useWorkspaceStatus(projectId: string | undefined) {
  const [status, setStatus] = useState<WorkspaceStatus>({
    currentPhase: 'CREATED',
    phaseStatus: 'idle',
    progress: 0,
    approvalRequests: [],
    pendingDocument: null,
    isLoading: true,
    error: null,
  });

  const fetchStatus = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline/status`);
      if (!res.ok) throw new Error('Failed to fetch pipeline status');
      const json = await res.json();
      if (json.success && json.data) {
        setStatus({
          currentPhase: json.data.currentPhase || 'CREATED',
          phaseStatus: json.data.phaseStatus || 'idle',
          progress: json.data.progress || 0,
          approvalRequests: json.data.approvalRequests || [],
          pendingDocument: json.data.pendingDocument || null,
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      console.error('Error fetching pipeline status:', err);
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, [projectId, fetchStatus]);

  return {
    ...status,
    refetchStatus: fetchStatus,
  };
}
