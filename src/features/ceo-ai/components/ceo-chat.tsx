'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UsageNote } from '@/features/billing/components/usage-note';
import { ProductVisionCard } from './product-vision-card';
import { RequirementViewer } from './requirement-viewer';
import { RoadmapViewer } from './roadmap-viewer';
import { Loader2, AlertCircle } from 'lucide-react';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';

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
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null; }
  }

  useEffect(() => {
    checkStatus();
    return () => { stopPolling(); };
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
      } else {
        setError(json.error?.message ?? 'Analysis failed');
        setRunning(false);
        setLoading(false);
      }
    } catch (err) {
      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      setError(isTimeout ? 'Analysis timed out. Check your AI provider keys.' : 'Network error. Please try again.');
      setRunning(false);
      setLoading(false);
      if (isTimeout) {
        fetch(`/api/projects/${projectId}/ceo-cancel`, { method: 'POST' }).catch(() => {});
      }
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps -- checkStatus on projectId change covers this; no need for a second redundant fire

  if (loading && !running) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Checking status...</span>
        </div>
      </div>
    );
  }

  if (running) {
    const timedOut = runDuration > CHECK_TIMEOUT / 1000;
    return (
      <div className="space-y-4 p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-sm font-medium">CEO AI is analyzing your idea...</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {timedOut
            ? 'This is taking longer than expected. You can reset and try again.'
            : `Running for ${runDuration}s... You can switch tabs while it works.`}
        </p>
        {timedOut && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRunning(false);
              setLoading(false);
              setError(null);
              setRunDuration(0);
              stopPolling();
              fetch(`/api/projects/${projectId}/ceo-cancel`, { method: 'POST' }).catch(() => {});
            }}
          >
            Reset &amp; Try Again
          </Button>
        )}
      </div>
    );
  }

  if (output) {
    return (
      <div className="space-y-4">
        <ProductVisionCard vision={output.vision} />
        <RequirementViewer requirements={output.requirements} />
        <RoadmapViewer plan={output.plan} />
        <UsageNote tokens={tokensUsed} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Describe your product idea..." className="bg-background flex-1 rounded-md border px-3 py-2 text-sm" />
        <Button onClick={() => handleAnalyze()} disabled={!idea.trim()}>Analyze</Button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}
    </div>
  );
}
