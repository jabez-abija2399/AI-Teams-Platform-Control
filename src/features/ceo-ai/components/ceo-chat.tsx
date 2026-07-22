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
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function checkStatus() {
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
      } else {
        setLoading(false);
      }
    }
  }

  function startPolling() {
    if (pollRef.current) return;
    pollRef.current = setInterval(checkStatus, 5000);
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  useEffect(() => {
    checkStatus();
    return () => stopPolling();
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
    try {
      const res = await fetch('/api/ai/ceo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, userIdea: text }),
      });
      const json = await res.json();
      if (json.success) {
        setOutput(json.data);
        setTokensUsed(json.data._tokensUsed ?? 0);
        setRunning(false);
        setLoading(false);
        onComplete?.(json.data);
      } else {
        setError(json.error?.message ?? 'Failed');
        setRunning(false);
        setLoading(false);
      }
    } catch {
      setError('Network error');
      setRunning(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loading && !output && !running && defaultIdea) {
      checkStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultIdea]);

  if (running) {
    return (
      <div className="space-y-4 p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-sm font-medium">CEO AI is analyzing your idea...</span>
        </div>
        <p className="text-xs text-muted-foreground">This takes 30-60 seconds. You can switch tabs — it will keep running.</p>
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
      {!loading && !output && (
        <div className="flex gap-2">
          <input value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="Describe your product idea..." className="bg-background flex-1 rounded-md border px-3 py-2 text-sm" />
          <Button onClick={() => handleAnalyze()} disabled={running || !idea.trim()}>Analyze</Button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-red-500">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}
    </div>
  );
}
