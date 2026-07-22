'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ThinkingSteps } from '@/features/onboarding/components/thinking-steps';
import { UsageNote } from '@/features/billing/components/usage-note';
import { SystemDiagram } from './system-diagram';
import { DatabaseViewer } from './database-viewer';
import { APIDocumentViewer } from './api-document-viewer';
import { TechnologyDecisionCard } from './technology-decision-card';
import { Loader2, AlertCircle } from 'lucide-react';
import type { ArchitectAnalysis } from '@/ai/agents/roles/architect/architect.types';
import type { ProductRequirement } from '@/ai/agents/roles/ceo/ceo.types';

interface ArchitectureChatProps {
  projectId: string;
  defaultRequirements?: ProductRequirement;
  onComplete?: () => void;
}

const DESIGN_STEPS = [
  { label: 'Analyzing requirements' },
  { label: 'Designing system architecture' },
  { label: 'Planning database schema' },
  { label: 'Defining API contracts' },
];

export function ArchitectureChat({ projectId, defaultRequirements, onComplete }: ArchitectureChatProps) {
  const [requirements, setRequirements] = useState(defaultRequirements ? JSON.stringify(defaultRequirements.features) : '');
  const [loading, setLoading] = useState(true);
  const [output, setOutput] = useState<ArchitectAnalysis | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function checkStatus() {
    const res = await fetch(`/api/projects/${projectId}/architect-status`);
    const json = await res.json();
    if (json.success) {
      if (json.data.exists) {
        setOutput(json.data.analysis);
        setRunning(false);
        setLoading(false);
        onComplete?.();
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

  async function handleDesign() {
    const reqs = defaultRequirements ?? { features: [{ name: 'Core Feature', description: requirements }], userStories: [], priorities: [], constraints: [] };
    setRunning(true);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, requirements: reqs }),
      });
      const json = await res.json();
      if (json.success) {
        setOutput(json.data);
        setTokensUsed(json.data._tokensUsed ?? 0);
        setRunning(false);
        setLoading(false);
        onComplete?.();
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
    if (loading && !output && !running && defaultRequirements) {
      checkStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultRequirements]);

  if (running) {
    return (
      <div className="space-y-4">
        <ThinkingSteps steps={DESIGN_STEPS} />
        <div className="flex items-center justify-center gap-2 p-4">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span className="text-xs text-muted-foreground">Architect AI is designing... You can switch tabs.</span>
        </div>
      </div>
    );
  }

  if (output) {
    return (
      <div className="space-y-4">
        <SystemDiagram architecture={output.architecture} />
        <DatabaseViewer database={output.database} />
        <APIDocumentViewer api={output.api} />
        <TechnologyDecisionCard decisions={output.decisions} />
        <UsageNote tokens={tokensUsed} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!loading && !output && (
        <div className="flex gap-2">
          <input value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Describe what to build..." className="bg-background flex-1 rounded-md border px-3 py-2 text-sm" />
          <Button onClick={handleDesign} disabled={running || !requirements.trim()}>Design</Button>
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
