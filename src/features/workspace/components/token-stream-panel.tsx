'use client';

import { useEffect, useRef, useState } from 'react';
import { Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Live SSE token stream from the LLM / generation bus (not a fake typewriter).
 */
export function TokenStreamPanel({
  projectId,
  active,
  fallbackMessage,
  className,
}: {
  projectId: string;
  active?: boolean;
  fallbackMessage?: string;
  className?: string;
}) {
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId || !active) return;

    const source = new EventSource(
      `/api/projects/${projectId}/pipeline/generation-stream`,
    );

    source.addEventListener('connected', () => setConnected(true));
    source.addEventListener('generation', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as {
          type: string;
          content?: string;
          message?: string;
        };
        if (data.type === 'token' && data.content) {
          setText((prev) => (prev + data.content!).slice(-6000));
        }
        if (data.type === 'status' && data.message) {
          setStatus(data.message);
        }
        if (data.type === 'done') {
          setStatus('Generation step finished');
        }
        if (data.type === 'error' && data.message) {
          setStatus(data.message);
        }
      } catch {
        /* ignore malformed */
      }
    });
    source.onerror = () => {
      setConnected(false);
      source.close();
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [projectId, active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [text]);

  if (!active) return null;

  const display = text.trim() || fallbackMessage || 'Waiting for model tokens…';

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.04]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border/70 px-3.5 py-2">
        <div className="flex items-center gap-2 text-[11px] font-medium text-primary">
          <Radio className={cn('h-3.5 w-3.5', connected && 'animate-soft-pulse')} />
          Live model stream
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          {connected ? 'SSE' : 'reconnecting…'}
        </span>
      </div>
      {status && (
        <p className="border-b border-border/50 px-3.5 py-1.5 text-[11px] text-muted-foreground">
          {status}
        </p>
      )}
      <div className="max-h-40 overflow-y-auto px-3.5 py-3">
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90">
          {display}
          {connected && (
            <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] animate-soft-pulse bg-primary" />
          )}
        </pre>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
