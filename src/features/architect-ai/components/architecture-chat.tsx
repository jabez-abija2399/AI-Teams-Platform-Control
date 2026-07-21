'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { SystemDiagram } from './system-diagram';
import { DatabaseViewer } from './database-viewer';
import { APIDocumentViewer } from './api-document-viewer';
import { TechnologyDecisionCard } from './technology-decision-card';
import type { ArchitectAnalysis } from '@/ai/agents/roles/architect/architect.types';
import type { ProductRequirement } from '@/ai/agents/roles/ceo/ceo.types';

interface ArchitectureChatProps {
  projectId: string;
  defaultRequirements?: ProductRequirement;
}

export function ArchitectureChat({ projectId, defaultRequirements }: ArchitectureChatProps) {
  const [requirements, setRequirements] = useState(
    defaultRequirements ? JSON.stringify(defaultRequirements.features) : '',
  );
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<ArchitectAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoRan = useRef(false);

  async function handleDesign() {
    const reqs = defaultRequirements ?? {
      features: [{ name: 'Core Feature', description: requirements }],
      userStories: [],
      priorities: [],
      constraints: [],
    };
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
    if (!autoRan.current && defaultRequirements && !output && !loading) {
      autoRan.current = true;
      handleDesign();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultRequirements]);

  return (
    <div className="space-y-4">
      {!loading && !output && (
        <div className="flex gap-2">
          <input
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Describe what to build..."
            className="bg-background flex-1 rounded-md border px-3 py-2 text-sm"
          />
          <Button onClick={handleDesign} disabled={loading || !requirements.trim()}>
            Design
          </Button>
        </div>
      )}
      {loading && (
        <p className="text-muted-foreground text-sm">Architect AI is designing the system...</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {output && (
        <div className="space-y-4">
          <SystemDiagram architecture={output.architecture} />
          <DatabaseViewer database={output.database} />
          <APIDocumentViewer api={output.api} />
          <TechnologyDecisionCard decisions={output.decisions} />
        </div>
      )}
    </div>
  );
}
