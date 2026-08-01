"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";

export interface PipelineEmployee {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "active" | "idle" | "completed" | "waiting";
  currentTask?: string;
  confidence?: number;
}

export interface PipelinePhase {
  id: string;
  name: string;
  status: "completed" | "active" | "pending" | "failed";
  agentRole: string;
  progress?: number;
}

export type PipelineActivityType = "created" | "reviewed" | "fixed" | "deployed" | "approved" | "started" | "completed";

export interface PipelineActivity {
  id: string;
  agentName: string;
  agentAvatar: string;
  action: string;
  timestamp: Date | string;
  type: PipelineActivityType;
}

export interface PipelineArtifact {
  id: string;
  name: string;
  type: string;
  createdBy: string;
  createdAt: Date | string;
  status: "draft" | "review" | "approved" | "rejected";
  score?: number;
}

export interface PipelineApproval {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  artifactName?: string;
  urgency: "normal" | "high" | "critical";
}

export interface PipelineState {
  currentPhase: string;
  phaseStatus: "running" | "completed" | "approval" | "waiting";
  progress: number;
  healthScore: number;
  timeElapsed: string;
  phases: PipelinePhase[];
  employees: PipelineEmployee[];
  activities: PipelineActivity[];
  artifacts: PipelineArtifact[];
  approvalRequests: PipelineApproval[];
}

interface PipelineContextValue {
  state: PipelineState;
  loading: boolean;
  error: string | null;
  approve: (approvalType: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const defaultState: PipelineState = {
  currentPhase: "discovery",
  phaseStatus: "waiting",
  progress: 0,
  healthScore: 95,
  timeElapsed: "0m",
  phases: [],
  employees: [],
  activities: [],
  artifacts: [],
  approvalRequests: [],
};

const PipelineContext = createContext<PipelineContextValue>({
  state: defaultState,
  loading: true,
  error: null,
  approve: async () => {},
  refresh: async () => {},
});

export function usePipeline(projectId: string): PipelineContextValue {
  const [state, setState] = useState<PipelineState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success && result.data) {
        setState(result.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch pipeline status");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    if (!projectId || projectId === "undefined") return;
    fetchStatus();
  }, [projectId, fetchStatus]);

  // SSE connection for real-time updates (with debounced refetch)
  useEffect(() => {
    if (!projectId || projectId === "undefined") return;

    const debouncedRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchStatus();
      }, 2000);
    };

    try {
      const source = new EventSource(`/api/projects/${projectId}/execution/stream`);
      abortRef.current = new AbortController();
      setSseConnected(true);

      source.addEventListener("pipeline_event", () => {
        debouncedRefresh();
      });

      source.addEventListener("timeline_event", () => {
        debouncedRefresh();
      });

      source.addEventListener("connected", () => {
        setSseConnected(true);
      });

      source.onerror = () => {
        setSseConnected(false);
        source.close();
      };

      return () => {
        source.close();
        setSseConnected(false);
      };
    } catch {
      setSseConnected(false);
    }
  }, [projectId, fetchStatus]);

  // Fallback polling if SSE not connected
  useEffect(() => {
    if (sseConnected) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    if (!projectId || projectId === "undefined") return;

    pollRef.current = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [projectId, sseConnected, fetchStatus]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const approve = useCallback(
    async (approvalType: string) => {
      try {
        const res = await fetch(`/api/projects/${projectId}/pipeline/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvalType }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Refresh state after approval
        setTimeout(fetchStatus, 500);
      } catch (err: any) {
        setError(err?.message || "Failed to approve");
      }
    },
    [projectId, fetchStatus],
  );

  const refresh = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  return { state, loading, error, approve, refresh };
}

export function usePipelineContext() {
  return useContext(PipelineContext);
}

export { PipelineContext, defaultState };
