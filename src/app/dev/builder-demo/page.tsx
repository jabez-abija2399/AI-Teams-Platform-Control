'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SSEProgressData {
  jobId?: string;
  step?: string;
  percent?: number;
  errorLogs?: string;
  projectId?: string;
  message?: string;
}

export default function BuilderDemoPage() {
  const [projectId, setProjectId] = useState('demo-proj-1');
  const [userPrompt, setUserPrompt] = useState('Build a modern TypeScript button component');
  const [isBuilding, setIsBuilding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('IDLE');
  const [logs, setLogs] = useState<string[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const startBuild = async () => {
    setIsBuilding(true);
    setProgress(5);
    setCurrentStep('ENQUEUING_JOB');
    setLogs([]);
    addLog(`Initiating build job for project: ${projectId}`);

    // Close any prior stream
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // 1. Connect to SSE Stream Gateway
    const sseUrl = `/api/ai/developer/stream/${projectId}`;
    addLog(`Connecting to real-time SSE stream: ${sseUrl}`);
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.addEventListener('connected', (e: MessageEvent) => {
      const data: SSEProgressData = JSON.parse(e.data);
      addLog(`SSE Gateway Connected: ${data.message}`);
    });

    es.addEventListener('progress', (e: MessageEvent) => {
      const data: SSEProgressData = JSON.parse(e.data);
      if (data.percent !== undefined) setProgress(data.percent);
      if (data.step) setCurrentStep(data.step);
      addLog(`[Progress] Step: ${data.step} (${data.percent}%)`);
      if (data.errorLogs) {
        addLog(`[Self-Healing Error Log]:\n${data.errorLogs}`);
      }
    });

    es.addEventListener('completed', (e: MessageEvent) => {
      const data: SSEProgressData = JSON.parse(e.data);
      setProgress(100);
      setCurrentStep('COMPLETED');
      setIsBuilding(false);
      addLog(`🎉 Job Completed Successfully! ID: ${data.jobId}`);
      es.close();
    });

    es.addEventListener('failed', (e: MessageEvent) => {
      const data: SSEProgressData = JSON.parse(e.data);
      setCurrentStep('FAILED');
      setIsBuilding(false);
      addLog(`❌ Job Failed: ${data.message || 'Unknown error'}`);
      es.close();
    });

    // 2. Post build trigger to API
    try {
      const res = await fetch('/api/ai/developer/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userPrompt,
        }),
      });

      const data = await res.json();
      if (data.success) {
        addLog(`Job enqueued cleanly to BullMQ. Job ID: ${data.jobId}`);
      } else {
        addLog(`API Error: ${data.error}`);
        setIsBuilding(false);
      }
    } catch (err) {
      addLog(`Network Error triggering build: ${String(err)}`);
      setIsBuilding(false);
    }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-10 space-y-6">
      <div>
        <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          Developer Mode
        </span>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          BullMQ & SSE Streaming Build Harness
        </h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Live stream test harness for background AI Developer worker jobs, step dispatch, and self-healing loop.
        </p>
      </div>

      <div className="rounded-2xl border border-border/80 glass-card p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Target Project ID
          </label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5 text-xs font-mono text-foreground outline-none transition-shadow focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            Software Vision Prompt
          </label>
          <input
            type="text"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            className="w-full rounded-xl border border-border/70 bg-background/80 px-3.5 py-2.5 text-xs text-foreground outline-none transition-shadow focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          onClick={startBuild}
          disabled={isBuilding}
          className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 disabled:opacity-50"
        >
          {isBuilding ? '⚡ Running Build Task in Background...' : '🚀 Trigger AI Build Job'}
        </button>
      </div>

      {/* Progress Section */}
      <div className="rounded-2xl border border-border/80 glass-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-foreground">
            Status: <span className="text-primary font-mono">{currentStep}</span>
          </span>
          <span className="text-primary font-mono">{progress}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary/80 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Terminal Logs */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          SSE Live Stream Terminal Output
        </h3>
        <div className="h-64 overflow-y-auto rounded-2xl border border-border/80 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-emerald-400 shadow-inner">
          {logs.length === 0 ? (
            <span className="text-slate-500">Click &quot;Trigger AI Build Job&quot; to observe live events...</span>
          ) : (
            logs.map((log, index) => <div key={index}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
