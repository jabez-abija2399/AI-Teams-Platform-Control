'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getWebContainerInstance, resetWebContainerInstance, buildFileSystemTree, buildFileSystemTreeFromRecord } from '@/lib/webcontainer/container-service';
import type { FileSystemTree } from '@webcontainer/api';

export type WCStatus = 'IDLE' | 'BOOTING' | 'MOUNTING' | 'INSTALLING' | 'STARTING' | 'READY' | 'ERROR';

export interface WCTerminalLog {
  id: string;
  timestamp: string;
  message: string;
  source: 'stdout' | 'stderr' | 'system';
}

export interface UseWebContainerPreviewResult {
  previewUrl: string | null;
  status: WCStatus;
  terminalLogs: WCTerminalLog[];
  error: string | null;
  start: (files: Record<string, string>) => Promise<void>;
  stop: () => void;
  retry: () => Promise<void>;
  clearLogs: () => void;
}

function makeLog(message: string, source: WCTerminalLog['source']): WCTerminalLog {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString(),
    message,
    source,
  };
}

export function useWebContainerPreview(): UseWebContainerPreviewResult {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<WCStatus>('IDLE');
  const [terminalLogs, setTerminalLogs] = useState<WCTerminalLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<boolean>(false);
  const devProcessRef = useRef<{ kill: () => void } | null>(null);

  const addLog = useCallback((message: string, source: WCTerminalLog['source']) => {
    setTerminalLogs((prev) => [...prev, makeLog(message, source)]);
  }, []);

  const readStream = useCallback(async (reader: ReadableStreamDefaultReader<string>, source: 'stdout' | 'stderr') => {
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      addLog(value, source);
    }
  }, [addLog]);

  const stop = useCallback(() => {
    abortRef.current = true;
    if (devProcessRef.current) {
      try { devProcessRef.current.kill(); } catch { }
      devProcessRef.current = null;
    }
    resetWebContainerInstance();
    setPreviewUrl(null);
    setStatus('IDLE');
    setError(null);
  }, []);

  const start = useCallback(async (files: Record<string, string>) => {
    abortRef.current = false;
    setError(null);
    setPreviewUrl(null);
    setStatus('BOOTING');
    addLog('Booting WebContainer...', 'system');

    try {
      const container = await getWebContainerInstance();

      if (abortRef.current) return;
      setStatus('MOUNTING');
      addLog('Mounting project files...', 'system');

      const fileTree = buildFileSystemTreeFromRecord(files);
      await container.mount(fileTree);

      if (abortRef.current) return;
      setStatus('INSTALLING');
      addLog('Running npm install...', 'system');

      const installProcess = await container.spawn('npm', ['install']);
      const installReader = installProcess.output.getReader();
      readStream(installReader, 'stdout');
      const installExit = await installProcess.exit;

      if (installExit !== 0) {
        setStatus('ERROR');
        setError(`npm install failed with exit code ${installExit}`);
        addLog(`npm install exited with code ${installExit}`, 'stderr');
        return;
      }

      if (abortRef.current) return;
      setStatus('STARTING');
      addLog('Starting Next.js dev server...', 'system');

      const devProcess = await container.spawn('npx', ['next', 'dev', '--port', '3000']);
      devProcessRef.current = devProcess;

      const devReader = devProcess.output.getReader();
      readStream(devReader, 'stdout');

      const unsubServerReady = container.on('server-ready', (_port: number, url: string) => {
        if (abortRef.current) return;
        addLog(`Dev server ready at ${url}`, 'system');
        setPreviewUrl(url);
        setStatus('READY');
      });

      devProcess.exit.then((code) => {
        unsubServerReady();
        if (!abortRef.current) {
          addLog(`Dev server exited with code ${code}`, 'stderr');
          setStatus('ERROR');
          setError(`Dev server exited unexpectedly (code ${code})`);
        }
      });
    } catch (err) {
      if (abortRef.current) return;
      const message = err instanceof Error ? err.message : String(err);
      addLog(`WebContainer unavailable: ${message}`, 'system');
      // Stay at IDLE — don't set ERROR since this is expected on pages
      // without COOP/COEP headers (dashboard). Caller falls back to inline preview.
      setStatus('IDLE');
      setError(null);
      setPreviewUrl(null);
    }
  }, [addLog, readStream]);

  const clearLogs = useCallback(() => {
    setTerminalLogs([]);
  }, []);

  const retry = useCallback(async () => {
    abortRef.current = false;
    setError(null);
    setPreviewUrl(null);
    
    try {
      const container = await getWebContainerInstance();
      
      const lastLog = terminalLogs[terminalLogs.length - 1]?.message || '';
      const isInstallError = status === 'INSTALLING' || lastLog.includes('npm install') || error?.includes('npm install');

      if (isInstallError) {
        setStatus('INSTALLING');
        addLog('Retrying npm install...', 'system');
        const installProcess = await container.spawn('npm', ['install']);
        const installReader = installProcess.output.getReader();
        readStream(installReader, 'stdout');
        const installExit = await installProcess.exit;

        if (installExit !== 0) {
          setStatus('ERROR');
          setError(`npm install failed with exit code ${installExit}`);
          addLog(`npm install exited with code ${installExit}`, 'stderr');
          return;
        }
      }

      if (abortRef.current) return;
      setStatus('STARTING');
      addLog('Retrying Next.js dev server...', 'system');

      if (devProcessRef.current) {
        try { devProcessRef.current.kill(); } catch {}
      }

      const devProcess = await container.spawn('npx', ['next', 'dev', '--port', '3000']);
      devProcessRef.current = devProcess;
      const devReader = devProcess.output.getReader();
      readStream(devReader, 'stdout');

      const unsubServerReady = container.on('server-ready', (_port: number, url: string) => {
        if (abortRef.current) return;
        addLog(`Dev server ready at ${url}`, 'system');
        setPreviewUrl(url);
        setStatus('READY');
      });

      devProcess.exit.then((code) => {
        unsubServerReady();
        if (!abortRef.current) {
          addLog(`Dev server exited with code ${code}`, 'stderr');
          setStatus('ERROR');
          setError(`Dev server exited unexpectedly (code ${code})`);
        }
      });
    } catch (err) {
      if (abortRef.current) return;
      const message = err instanceof Error ? err.message : String(err);
      addLog(`Retry failed: ${message}`, 'system');
      setStatus('ERROR');
    }
  }, [addLog, readStream, status, error, terminalLogs]);

  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (devProcessRef.current) {
        try { devProcessRef.current.kill(); } catch { }
      }
    };
  }, []);

  return { previewUrl, status, terminalLogs, error, start, stop, retry, clearLogs };
}
