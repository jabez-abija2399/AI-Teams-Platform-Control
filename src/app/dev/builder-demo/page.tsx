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
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'system-ui, sans-serif', padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', borderRadius: '12px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#38bdf8' }}>
        BullMQ + E2B Sandbox Real-Time Build Monitor
      </h1>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
        Test real-time event streaming and background microVM build execution directly in your browser.
      </p>

      <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
            Project ID
          </label>
          <input
            type="text"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
            User Prompt
          </label>
          <input
            type="text"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
          />
        </div>

        <button
          onClick={startBuild}
          disabled={isBuilding}
          style={{
            padding: '12px',
            backgroundColor: isBuilding ? '#475569' : '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: isBuilding ? 'not-allowed' : 'pointer',
            marginTop: '8px',
          }}
        >
          {isBuilding ? 'Running Build Task in Background...' : '🚀 Trigger AI Build Job'}
        </button>
      </div>

      {/* Progress Section */}
      <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
            Status: <span style={{ color: '#38bdf8' }}>{currentStep}</span>
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#38bdf8' }}>{progress}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              backgroundColor: '#0284c7',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Terminal Logs */}
      <div>
        <h3 style={{ fontSize: '14px', color: '#cbd5e1', marginBottom: '8px' }}>SSE Live Stream Terminal Output</h3>
        <div
          style={{
            backgroundColor: '#020617',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '16px',
            height: '240px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#4ade80',
          }}
        >
          {logs.length === 0 ? (
            <span style={{ color: '#64748b' }}>Click "Trigger AI Build Job" to observe live events...</span>
          ) : (
            logs.map((log, index) => <div key={index}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
}
