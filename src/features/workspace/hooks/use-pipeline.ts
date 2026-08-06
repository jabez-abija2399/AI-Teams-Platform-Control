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
  /** Full document body for Deliverables reopen */
  content?: unknown;
  summary?: string;
  producedBy?: string;
}

export interface PipelineApproval {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  artifactName?: string;
  urgency: "normal" | "high" | "critical";
}

export interface PendingDocument {
  title: string;
  type: string;
  summary?: string;
  producedBy?: string;
  content: unknown;
}

export interface LiveGenerationInfo {
  kind:
    | "idle"
    | "running"
    | "regenerating"
    | "approval"
    | "stuck"
    | "failed"
    | "credits"
    | "rate_limited"
    | "completed";
  tone: "working" | "waiting" | "success" | "warning" | "error";
  title: string;
  message: string;
  detail?: string;
  progressLabel?: string;
  heartbeatAt?: string | null;
  stuckSeconds?: number;
  actionLabel?: string;
  canRetry: boolean;
}

export interface TokenUsageInfo {
  totalTokens: number;
  totalCostUsd: number;
  sessionTokens: number;
  sessionCostUsd: number;
}

export interface CreditBalanceInfo {
  balance: number | null;
  monthlyLimit: number | null;
  source: "organization" | "project" | "unknown";
  lowBalance: boolean;
}

export interface DeliverableCheckItem {
  phase: string;
  department: string;
  artifactType: string;
  status: "done" | "active" | "blocked" | "pending";
  hasArtifact: boolean;
}

export interface RevisionDiffInfo {
  title: string;
  feedback?: string;
  before: unknown;
  after: unknown;
}

export interface PipelineState {
  currentPhase: string;
  phaseStatus: "running" | "completed" | "approval" | "waiting" | "failed";
  progress: number;
  healthScore: number;
  timeElapsed: string;
  phases: PipelinePhase[];
  employees: PipelineEmployee[];
  activities: PipelineActivity[];
  artifacts: PipelineArtifact[];
  approvalRequests: PipelineApproval[];
  pendingDocument?: PendingDocument | null;
  liveGeneration?: LiveGenerationInfo | null;
  usage?: TokenUsageInfo | null;
  credits?: CreditBalanceInfo | null;
  strictMode?: boolean;
  deliverableChecklist?: DeliverableCheckItem[] | null;
  deliveryPlan?: {
    fileStructure?: Array<{ path: string; type: string; description: string }>;
    implementationTodos?: Array<{
      id: string;
      title: string;
      description?: string;
      files?: string[];
      status: "pending" | "in_progress" | "done" | "failed";
    }>;
    qaTodos?: Array<{
      id: string;
      title: string;
      description?: string;
      status: "pending" | "in_progress" | "done" | "failed";
    }>;
    progress?: { done: number; total: number; percent: number };
  } | null;
  revisionDiff?: RevisionDiffInfo | null;
  /** Server lifecycle phase (e.g. COMPLETED, PRODUCT_RUNNING). */
  lifecyclePhase?: string;
  /** True only when the pipeline has never been started (CREATED). */
  canStart?: boolean;
}

interface PipelineContextValue {
  state: PipelineState;
  loading: boolean;
  error: string | null;
  /** Live link to Mission Control stream / polls */
  connectionStatus: "connected" | "reconnecting" | "polling" | "offline";
  approve: (approvalType: string) => Promise<void>;
  requestChanges: (approvalType: string, comments: string) => Promise<void>;
  retryGeneration: () => Promise<void>;
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
  pendingDocument: null,
  liveGeneration: null,
  usage: null,
  credits: null,
  strictMode: false,
  deliverableChecklist: null,
  deliveryPlan: null,
  revisionDiff: null,
  lifecyclePhase: undefined,
  // Never show Start until status hydrates — avoids false Start+0% on failed/slow loads.
  canStart: false,
};

const PipelineContext = createContext<PipelineContextValue>({
  state: defaultState,
  loading: true,
  error: null,
  connectionStatus: "reconnecting",
  approve: async () => {},
  requestChanges: async () => {},
  retryGeneration: async () => {},
  refresh: async () => {},
});

export function usePipeline(projectId: string): PipelineContextValue {
  const [state, setState] = useState<PipelineState>(defaultState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastGoodRef = useRef<PipelineState | null>(null);

  const fetchStatus = useCallback(async (opts?: { showLoading?: boolean }) => {
    if (opts?.showLoading) setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline/status`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.success && result.data) {
        const next = result.data as PipelineState;
        lastGoodRef.current = next;
        setHydrated(true);
        setState(next);
        setError(null);
      } else if (!lastGoodRef.current) {
        setError(result?.error?.message || "Could not load pipeline status");
      }
    } catch (err: any) {
      // Keep last good UI — never wipe canStart / progress on a blip
      if (lastGoodRef.current) {
        setState(lastGoodRef.current);
        setHydrated(true);
      }
      // Only surface error if we have never loaded
      if (!lastGoodRef.current) {
        setError(err?.message || "Failed to fetch pipeline status");
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Reset when switching projects
  useEffect(() => {
    lastGoodRef.current = null;
    setHydrated(false);
    setState(defaultState);
    setLoading(true);
    setError(null);
    setSseConnected(false);
  }, [projectId]);

  // Initial fetch
  useEffect(() => {
    if (!projectId || projectId === "undefined") return;
    void fetchStatus();
  }, [projectId, fetchStatus]);

  // Optional SSE — never drives the "Reconnecting" badge; polls are source of truth
  useEffect(() => {
    if (!projectId || projectId === "undefined") return;

    let source: EventSource | null = null;
    let closed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const debouncedRefresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchStatus();
      }, 1500);
    };

    const connect = () => {
      if (closed) return;
      try {
        source = new EventSource(`/api/projects/${projectId}/execution/stream`);

        source.addEventListener("pipeline_event", debouncedRefresh);
        source.addEventListener("timeline_event", debouncedRefresh);
        source.addEventListener("connected", () => {
          attempt = 0;
          setSseConnected(true);
        });
        source.addEventListener("heartbeat", () => {
          setSseConnected(true);
        });
        source.onopen = () => {
          attempt = 0;
          setSseConnected(true);
        };
        source.onerror = () => {
          setSseConnected(false);
          source?.close();
          source = null;
          if (closed) return;
          const delay = Math.min(20_000, 1500 * Math.pow(2, attempt));
          attempt += 1;
          retryTimer = setTimeout(connect, delay);
        };
      } catch {
        setSseConnected(false);
        if (!closed) retryTimer = setTimeout(connect, 4000);
      }
    };

    connect();

    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      source?.close();
      setSseConnected(false);
    };
  }, [projectId, fetchStatus]);

  // Always poll — Mission Control stays honest even when SSE is down
  useEffect(() => {
    if (!projectId || projectId === "undefined") return;

    const liveKind = state.liveGeneration?.kind;
    const shouldPollFast =
      !sseConnected ||
      state.phaseStatus === "running" ||
      state.phaseStatus === "approval" ||
      state.phaseStatus === "failed" ||
      liveKind === "stuck" ||
      liveKind === "regenerating" ||
      liveKind === "running" ||
      !hydrated;

    pollRef.current = setInterval(() => {
      void fetchStatus();
    }, shouldPollFast ? 2000 : 8000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [
    projectId,
    sseConnected,
    hydrated,
    state.phaseStatus,
    state.liveGeneration?.kind,
    fetchStatus,
  ]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  /**
   * Badge rules (user-facing):
   * - Once status has loaded → Connected (or Live if SSE up)
   * - Only Reconnecting while first load has not finished
   * - Offline only if first load failed and we have no data
   */
  const connectionStatus: PipelineContextValue["connectionStatus"] = (() => {
    if (hydrated) return sseConnected ? "connected" : "polling";
    if (loading) return "reconnecting";
    if (error) return "offline";
    return "reconnecting";
  })();

  const approve = useCallback(
    async (approvalType: string) => {
      try {
        const res = await fetch(`/api/projects/${projectId}/pipeline/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvalType, action: "approve" }),
        });

        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error?.message || `HTTP ${res.status}`);
        }

        setError(null);
        setTimeout(() => void fetchStatus(), 500);
      } catch (err: any) {
        setError(err?.message || "Failed to approve");
        throw err;
      }
    },
    [projectId, fetchStatus],
  );

  const requestChanges = useCallback(
    async (approvalType: string, comments: string) => {
      try {
        const res = await fetch(`/api/projects/${projectId}/pipeline/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approvalType,
            action: "request_changes",
            comments,
          }),
        });

        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(body?.error?.message || `HTTP ${res.status}`);
        }

        setError(null);
        setTimeout(() => void fetchStatus(), 500);
      } catch (err: any) {
        setError(err?.message || "Failed to request changes");
        throw err;
      }
    },
    [projectId, fetchStatus],
  );

  const retryGeneration = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error?.message || `HTTP ${res.status}`);
      }
      setError(null);
      setTimeout(() => void fetchStatus(), 400);
      setTimeout(() => void fetchStatus(), 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to resume generation");
      throw err;
    }
  }, [projectId, fetchStatus]);

  const refresh = useCallback(async () => {
    await fetchStatus({ showLoading: !lastGoodRef.current });
  }, [fetchStatus]);

  return {
    state,
    loading,
    error,
    connectionStatus,
    approve,
    requestChanges,
    retryGeneration,
    refresh,
  };
}

export function usePipelineContext() {
  return useContext(PipelineContext);
}

export { PipelineContext, defaultState };
