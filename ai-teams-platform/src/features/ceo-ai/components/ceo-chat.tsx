'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ProductVisionCard } from './product-vision-card';
import { RequirementViewer } from './requirement-viewer';
import { RoadmapViewer } from './roadmap-viewer';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';

interface CEOChatProps {
  projectId: string;
  defaultIdea?: string;
  onComplete?: (data: CEOAnalysis) => void;
}

export function CEOChat({ projectId, defaultIdea, onComplete }: CEOChatProps) {
  const [idea, setIdea] = useState(defaultIdea ?? '');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<CEOAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoRan = useRef(false);

  async function handleAnalyze(ideaText?: string) {
    const text = (ideaText ?? idea).trim();
    if (!text) return;
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
        onComplete?.(json.data);
      } else {
        setError(json.error?.message ?? 'Failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!autoRan.current && defaultIdea && !output && !loading) {
      autoRan.current = true;
      handleAnalyze(defaultIdea);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultIdea]);

  return (
    <div className="space-y-4">
      {!loading && !output && (
        <div className="flex gap-2">
          <input
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your product idea..."
            className="bg-background flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <Button onClick={() => handleAnalyze()} disabled={loading || !idea.trim()}>
            Analyze
          </Button>
        </div>
      )}
      {loading && (
        <p className="text-muted-foreground text-sm">CEO AI is analyzing your idea...</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {output && (
        <div className="space-y-4">
          <ProductVisionCard vision={output.vision} />
          <RequirementViewer requirements={output.requirements} />
          <RoadmapViewer plan={output.plan} />
        </div>
      )}
    </div>
  );
}
