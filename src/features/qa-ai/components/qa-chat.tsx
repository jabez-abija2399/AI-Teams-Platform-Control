'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { QualityScore } from './quality-score';
import { BugList } from './bug-list';
import { TestReport } from './test-report';
import { Loader2, AlertCircle } from 'lucide-react';
import type { BugReport, TestPlan } from '@/ai/agents/roles/qa/qa.types';

interface QAStatus {
  exists: boolean;
  running: boolean;
  score?: number;
  issues?: BugReport[];
  recommendations?: string[];
  testPlan?: TestPlan;
}

export function QAChat({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<QAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function checkStatus() {
    const res = await fetch(`/api/projects/${projectId}/qa-status`);
    const json = await res.json();
    if (json.success) {
      setStatus(json.data);
      if (json.data.running) {
        setBuilding(true);
      } else if (json.data.exists) {
        setBuilding(false);
        stopPolling();
      } else {
        setBuilding(false);
        stopPolling();
      }
    }
    setLoading(false);
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
    if (status?.running) startPolling();
    return () => stopPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.running]);

  async function handleRunQA() {
    setBuilding(true);
    setError(null);
    try {
      const devRes = await fetch(`/api/projects/${projectId}/developer-status`);
      const devJson = await devRes.json();
      if (!devJson.success || !devJson.data.exists) {
        setError('No developer output found. Run Developer AI first.');
        setBuilding(false);
        return;
      }

      const implementation = {
        plan: { tasks: [], files: devJson.data.files ?? [], dependencies: [], implementationOrder: [] },
        changes: (devJson.data.files ?? []).map((f: string) => ({ file: f, changeType: 'CREATE' as const, description: '', code: '' })),
        report: { completed: true, changedFiles: devJson.data.files ?? [], issues: [], notes: '' },
      };

      const qaRes = await fetch('/api/ai/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, implementation }),
      });
      const qaJson = await qaRes.json();
      if (qaJson.success) {
        checkStatus();
      } else {
        const errMsg = qaJson.error?.message ?? 'QA AI failed';
        setError(`Error (${qaRes.status}): ${errMsg}`);
        setBuilding(false);
      }
    } catch {
      setError('Network error');
      setBuilding(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading QA results...</p>;
  }

  if (status?.running || building) {
    return (
      <div className="space-y-4 p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-sm font-medium">QA AI is reviewing code...</span>
        </div>
        <p className="text-xs text-muted-foreground">This takes 30-60 seconds. You can switch tabs — it will keep running.</p>
        <p className="text-xs text-muted-foreground">This tab will auto-update when done.</p>
      </div>
    );
  }

  if (!status?.exists) {
    return (
      <div className="space-y-3 p-4 text-center text-sm">
        <p className="text-muted-foreground">No QA results yet.</p>
        <Button onClick={handleRunQA} size="sm">Run QA AI</Button>
        <p className="text-xs text-muted-foreground">Reviews the developer output for quality.</p>
        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="h-3.5 w-3.5" />{error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <QualityScore score={status.score ?? 0} />
      {status.testPlan && <TestReport testPlan={status.testPlan} />}
      <BugList bugs={status.issues ?? []} />
      {status.recommendations && status.recommendations.length > 0 && (
        <div className="rounded-md border p-3">
          <p className="text-muted-foreground mb-1 text-xs font-medium">Recommendations</p>
          <ul className="list-inside list-disc text-xs">
            {status.recommendations.map((r, i) => (
              <li key={i} className="text-muted-foreground">{r}</li>
            ))}
          </ul>
        </div>
      )}
      <Button onClick={handleRunQA} size="sm" variant="outline">Re-test</Button>
    </div>
  );
}
