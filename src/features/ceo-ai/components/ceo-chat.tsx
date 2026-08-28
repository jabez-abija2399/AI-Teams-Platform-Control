'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UsageNote } from '@/features/billing/components/usage-note';
import { ProductVisionCard } from './product-vision-card';
import { RequirementViewer } from './requirement-viewer';
import { RoadmapViewer } from './roadmap-viewer';
import { Loader2, AlertCircle, Sparkles, Send } from 'lucide-react';
import type { CEOAnalysis } from '@/packages/agents/roles/ceo/ceo.types';

interface CEOChatProps {
  projectId: string;
  defaultIdea?: string;
  onComplete?: (data: CEOAnalysis) => void;
}

export function CEOChat({ projectId, defaultIdea, onComplete }: CEOChatProps) {
  const [idea, setIdea] = useState(defaultIdea ?? '');
  const [loading, setLoading] = useState(true);
  const [output, setOutput] = useState<CEOAnalysis | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runDuration, setRunDuration] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const CHECK_TIMEOUT = 120_000;

  async function checkStatus() {
    try {
      const res = await fetch(`/api/projects/${projectId}/ceo-status`);
      const json = await res.json();
      if (json.success) {
        if (json.data.exists) {
          setOutput(json.data.analysis);
          setRunning(false);
          setLoading(false);
          onComplete?.(json.data.analysis);
          stopPolling();
        } else if (json.data.running) {
          setRunning(true);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } else {
        setError(json.error?.message || 'Failed to load analysis status');
        setLoading(false);
      }
    } catch (err) {
      console.error('[CEO Chat] Status check failed:', err);
      setLoading(false);
    }
  }

  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = setInterval(checkStatus, 5000);
    durationRef.current = setInterval(() => {
      setRunDuration((prev) => prev + 5);
    }, 5000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (durationRef.current) {
      clearInterval(durationRef.current);
      durationRef.current = null;
    }
  }

  useEffect(() => {
    checkStatus();
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (running) startPolling();
    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  async function handleAnalyze(ideaText?: string) {
    const text = (ideaText ?? idea).trim();
    if (!text) return;
    setRunning(true);
    setLoading(true);
    setError(null);
    setRunDuration(0);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT);
      const res = await fetch('/api/ai/ceo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userIdea: text }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const json = await res.json();
      if (json.success) {
        setOutput(json.data);
        setTokensUsed(json.data._tokensUsed ?? 0);
        setRunning(false);
        setLoading(false);
        onComplete?.(json.data);

        fetch(`/api/projects/${projectId}/lifecycle/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIdea: text }),
        }).catch(() => {});
      } else {
        setError(json.error?.message ?? 'Analysis failed');
        setRunning(false);
        setLoading(false);
      }
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      setError(
        isTimeout
          ? 'Analysis timed out. Check your AI provider keys.'
          : 'Network error. Please try again.',
      );
      setRunning(false);
      setLoading(false);
      if (isTimeout) {
        fetch(`/api/projects/${projectId}/ceo-cancel`, { method: 'POST' }).catch(() => {});
      }
    }
  }

  if (loading && !running) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Checking CEO agent status…</span>
        </div>
      </div>
    );
  }

  if (running) {
    const timedOut = runDuration > CHECK_TIMEOUT / 1000;
    return (
      <div className="mx-auto max-w-md space-y-5 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold">CEO AI is analyzing</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {timedOut
              ? 'This is taking longer than expected. You can reset and try again.'
              : `Working for ${runDuration}s — feel free to keep browsing.`}
          </p>
        </div>
        {timedOut && (
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => {
              setRunning(false);
              setLoading(false);
              setError(null);
              setRunDuration(0);
              stopPolling();
              fetch(`/api/projects/${projectId}/ceo-cancel`, { method: 'POST' }).catch(() => {});
            }}
          >
            Reset & try again
          </Button>
        )}
      </div>
    );
  }

  if (output) {
    return (
      <div className="space-y-4 p-1">
        <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          CEO analysis complete — pipeline can continue from these artifacts
        </div>
        <ProductVisionCard vision={output.vision} />
        <RequirementViewer requirements={output.requirements} />
        <RoadmapViewer plan={output.plan} />
        <UsageNote tokens={tokensUsed} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-semibold">Talk to your AI CEO</h3>
            <p className="text-xs text-muted-foreground">Describe the product. Get vision, requirements, and a roadmap.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. A hotel booking platform with room inventory, guest checkout, and an admin dashboard…"
            rows={3}
            className="min-h-[88px] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
          />
          <Button
            onClick={() => handleAnalyze()}
            disabled={!idea.trim()}
            className="h-11 shrink-0 rounded-xl sm:h-auto sm:self-stretch"
          >
            <Send className="mr-2 h-4 w-4" />
            Analyze
          </Button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
