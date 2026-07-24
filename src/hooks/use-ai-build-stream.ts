'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export type BuildStatus =
  | 'INITIALIZING'
  | 'ARCHITECT_PLANNING'
  | 'GENERATING_CODE'
  | 'QA_VERIFYING'
  | 'COMPLETED'
  | 'FAILED';

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface UseAIBuildStreamResult {
  status: BuildStatus;
  progress: number;
  currentStep: string;
  terminalLogs: TerminalLogEntry[];
  generatedFiles: Record<string, string>;
  previewUrl: string | null;
  activeFilePath: string | null;
  setActiveFilePath: (path: string | null) => void;
  updateFileContent: (path: string, content: string) => void;
  triggerBuild: (userPrompt: string) => Promise<void>;
  clearLogs: () => void;
}

export function useAIBuildStream(projectId: string): UseAIBuildStreamResult {
  const [status, setStatus] = useState<BuildStatus>('INITIALIZING');
  const [progress, setProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('IDLE');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({
    'src/index.ts': '// Welcome to AI Workspace\nexport const app = "AI Teams Platform";\n',
    'src/types.ts': 'export interface User {\n  id: string;\n  name: string;\n}\n',
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeFilePath, setActiveFilePath] = useState<string | null>('src/index.ts');

  const eventSourceRef = useRef<EventSource | null>(null);

  const addLog = useCallback((message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    const entry: TerminalLogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      message,
      level,
    };
    setTerminalLogs((prev) => [...prev, entry]);
  }, []);

  const updateFileContent = useCallback((path: string, content: string) => {
    setGeneratedFiles((prev) => ({
      ...prev,
      [path]: content,
    }));
  }, []);

  const clearLogs = useCallback(() => {
    setTerminalLogs([]);
  }, []);

  // Connect to SSE Stream Gateway
  useEffect(() => {
    if (!projectId) return;

    const streamUrl = `/api/ai/developer/stream/${projectId}`;
    addLog(`Connecting to real-time build stream: ${streamUrl}`, 'info');

    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener('connected', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setStatus('INITIALIZING');
        addLog(`[SSE Gateway] ${data.message || 'Connected to build stream'}`, 'info');
      } catch {
        addLog('[SSE Gateway] Stream connected', 'info');
      }
    });

    es.addEventListener('progress', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.percent !== undefined) setProgress(data.percent);
        if (data.step) {
          setCurrentStep(data.step);
          if (data.step.includes('PLANNING')) setStatus('ARCHITECT_PLANNING');
          else if (data.step.includes('WRITING') || data.step.includes('DEPENDENCIES')) setStatus('GENERATING_CODE');
          else if (data.step.includes('VERIFYING')) setStatus('QA_VERIFYING');
        }

        addLog(`[Step: ${data.step || 'BUILDING'}] Progress: ${data.percent || 0}%`, 'info');

        if (data.errorLogs) {
          addLog(`[Compiler Diagnostic Log]:\n${data.errorLogs}`, 'warn');
        }
      } catch (err) {
        addLog(`Error parsing progress event: ${String(err)}`, 'error');
      }
    });

    es.addEventListener('completed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setStatus('COMPLETED');
        setProgress(100);
        setCurrentStep('COMPLETED');
        if (data.previewUrl) setPreviewUrl(data.previewUrl);
        addLog(`🎉 Build job completed successfully! Job ID: ${data.jobId || 'N/A'}`, 'info');
      } catch {
        setStatus('COMPLETED');
        setProgress(100);
      }
      es.close();
    });

    es.addEventListener('failed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        setStatus('FAILED');
        setCurrentStep('FAILED');
        addLog(`❌ Build job failed: ${data.failedReason || 'Unknown error'}`, 'error');
      } catch {
        setStatus('FAILED');
      }
      es.close();
    });

    es.onerror = () => {
      addLog('Stream connection error. Reconnecting...', 'warn');
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [projectId, addLog]);

  // Trigger Build Action
  const triggerBuild = useCallback(async (userPrompt: string) => {
    setStatus('INITIALIZING');
    setProgress(5);
    setCurrentStep('ENQUEUING_JOB');
    addLog(`Initiating build job for project: ${projectId}`, 'info');

    try {
      const res = await fetch('/api/ai/developer/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          userPrompt,
          filesToGenerate: Object.entries(generatedFiles).map(([path, content]) => ({ path, content })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        addLog(`Job enqueued to BullMQ queue cleanly. Job ID: ${data.jobId}`, 'info');
      } else {
        setStatus('FAILED');
        addLog(`Failed to enqueue build job: ${data.error}`, 'error');
      }
    } catch (err) {
      setStatus('FAILED');
      addLog(`Network error triggering build: ${String(err)}`, 'error');
    }
  }, [projectId, generatedFiles, addLog]);

  return {
    status,
    progress,
    currentStep,
    terminalLogs,
    generatedFiles,
    previewUrl,
    activeFilePath,
    setActiveFilePath,
    updateFileContent,
    triggerBuild,
    clearLogs,
  };
}
