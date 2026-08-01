'use client';

import { useEffect, useRef } from 'react';
import { useExplorerStore } from '@/features/workspace/explorer/stores/explorer.store';

// Singleton: track SSE connections across component instances (e.g. tabs + workspace open)
const sharedSources = new Map<string, EventSource>();
const sharedSubs = new Map<string, number>();

export function WorkspaceBuildSync({ projectId }: { projectId: string }) {
  const triggerRefresh = useExplorerStore((s) => s.triggerRefresh);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Guard: don't do anything if projectId is invalid
  const validProjectId = projectId && projectId !== 'undefined' && projectId !== 'null';

  // Subscribe to developer build SSE — shared across mounting instances
  useEffect(() => {
    if (!validProjectId) return;
    const count = (sharedSubs.get(projectId) ?? 0) + 1;
    sharedSubs.set(projectId, count);

    if (!sharedSources.has(projectId)) {
      const source = new EventSource(`/api/ai/developer/stream/${projectId}`);
      sharedSources.set(projectId, source);

      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.phase === 'complete') {
            triggerRefresh();
            source.close();
            sharedSources.delete(projectId);
          }
        } catch {
          // ignore parse errors
        }
      };

      source.onerror = () => {
        source.close();
        sharedSources.delete(projectId);
      };
    }

    return () => {
      const remaining = (sharedSubs.get(projectId) ?? 1) - 1;
      if (remaining <= 0) {
        sharedSubs.delete(projectId);
        const source = sharedSources.get(projectId);
        if (source) {
          source.close();
          sharedSources.delete(projectId);
        }
      } else {
        sharedSubs.set(projectId, remaining);
      }
    };
  }, [projectId, triggerRefresh]);

  // Fallback: poll build-status for full workflow & missed events
  // Stops automatically when project reaches a terminal state or after 60 attempts (~5min)
  useEffect(() => {
    if (!validProjectId) return;
    if (pollRef.current) return;

    let attempts = 0;
    const MAX_ATTEMPTS = 60;
    const TERMINAL_STATES = new Set(['COMPLETED', 'ARCHIVED', 'REVIEW']);

    const check = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/projects/${projectId}/build-status`);
        const json = await res.json();
        if (json.success) {
          const status: string = json.data.projectStatus;
          if (TERMINAL_STATES.has(status) || !json.data.running) {
            triggerRefresh();
            if (pollRef.current) {
              clearInterval(pollRef.current);
              pollRef.current = null;
            }
            return;
          }
        }
      } catch {
        // ignore
      }

      if (attempts >= MAX_ATTEMPTS && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    check();
    pollRef.current = setInterval(check, 5000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [projectId, triggerRefresh]);

  // Check developer status on mount for completed builds
  useEffect(() => {
    if (!validProjectId) return;
    fetch(`/api/projects/${projectId}/developer-status`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data.exists) {
          triggerRefresh();
        }
      })
      .catch(() => {});
  }, [projectId, triggerRefresh]);

  return null;
}
