'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import type { GenerationStreamEvent } from '@/core/company-orchestration/generation-stream-bus';

interface UseGenerationStreamReturn {
  tokens: string;
  isStreaming: boolean;
  latestStatus: string | null;
  tokenCount: number;
  error: string | null;
  resetStream: () => void;
}

/**
 * Custom React hook for consuming real-time Server-Sent Events (SSE) from the AI Generation Bus.
 * Automatically handles EventSource lifecycle, reconnection backoff, and token buffering for the Monaco Code Viewer.
 */
export function useGenerationStream(projectId: string | undefined): UseGenerationStreamReturn {
  const [tokens, setTokens] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [latestStatus, setLatestStatus] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetStream = useCallback(() => {
    setTokens('');
    setTokenCount(0);
    setLatestStatus(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = `/api/projects/${projectId}/pipeline/generation-stream`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.addEventListener('connected', () => {
        if (!isMounted) return;
        setError(null);
      });

      es.addEventListener('generation', (event: MessageEvent) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data) as GenerationStreamEvent;
          
          if (payload.type === 'token') {
            setIsStreaming(true);
            setTokens((prev) => prev + payload.content);
            setTokenCount((prev) => prev + 1);
          } else if (payload.type === 'status') {
            setLatestStatus(payload.message);
          } else if (payload.type === 'done') {
            setIsStreaming(false);
          } else if (payload.type === 'error') {
            setIsStreaming(false);
            setError(payload.message);
          }
        } catch {
          // Ignore malformed event frames
        }
      });

      es.onerror = () => {
        if (!isMounted) return;
        setIsStreaming(false);
        es.close();
        
        // Reconnect after 3 seconds with backoff
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMounted) connect();
        }, 3000);
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [projectId]);

  return {
    tokens,
    isStreaming,
    latestStatus,
    tokenCount,
    error,
    resetStream,
  };
}
