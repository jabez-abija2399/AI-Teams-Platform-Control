'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  getWebContainerInstance,
  resetWebContainerInstance,
  buildFileSystemTreeFromRecord,
} from '@/lib/webcontainer/container-service';

export type WCStatus =
  | 'IDLE'
  | 'BOOTING'
  | 'MOUNTING'
  | 'INSTALLING'
  | 'STARTING'
  | 'READY'
  | 'ERROR';
export type WCRuntime = 'next' | 'vite';

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
  start: (files: Record<string, string>, runtime?: WCRuntime) => Promise<void>;
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

function spawnArgs(runtime: WCRuntime): { label: string; cmd: string[]; port: number } {
  if (runtime === 'vite') {
    return {
      label: 'Vite',
      cmd: ['npx', 'vite', '--host', '0.0.0.0', '--port', '5173'],
      port: 5173,
    };
  }
  return {
    label: 'Next.js',
    cmd: ['npx', 'next', 'dev', '--port', '3000'],
    port: 3000,
  };
}

export function useWebContainerPreview(): UseWebContainerPreviewResult {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<WCStatus>('IDLE');
  const [terminalLogs, setTerminalLogs] = useState<WCTerminalLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);
  const bootGenRef = useRef(0);
  const devProcessRef = useRef<{ kill: () => void } | null>(null);
  const lastFilesRef = useRef<Record<string, string> | null>(null);
  const runtimeRef = useRef<WCRuntime>('next');

  const addLog = useCallback((message: string, source: WCTerminalLog['source']) => {
    setTerminalLogs((prev) => [...prev, makeLog(message, source)]);
  }, []);

  const readStream = useCallback(
    async (reader: ReadableStreamDefaultReader<string>, source: 'stdout' | 'stderr') => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        addLog(value, source);
      }
    },
    [addLog],
  );

  const stop = useCallback(() => {
    abortRef.current = true;
    bootGenRef.current += 1;
    if (devProcessRef.current) {
      try {
        devProcessRef.current.kill();
      } catch {
        /* ignore */
      }
      devProcessRef.current = null;
    }
    resetWebContainerInstance();
    setPreviewUrl(null);
    setStatus('IDLE');
    setError(null);
  }, []);

  const startDevServer = useCallback(
    async (
      container: Awaited<ReturnType<typeof getWebContainerInstance>>,
      runtime: WCRuntime,
      gen: number,
    ) => {
      if (abortRef.current || gen !== bootGenRef.current) return;
      const { label, cmd, port } = spawnArgs(runtime);
      setStatus('STARTING');
      addLog(`Starting ${label} on port ${port}...`, 'system');

      const [bin, ...args] = cmd;
      const devProcess = await container.spawn(bin!, args);
      if (abortRef.current || gen !== bootGenRef.current) {
        try {
          devProcess.kill();
        } catch {
          /* ignore */
        }
        return;
      }
      devProcessRef.current = devProcess;
      const outReader = devProcess.output.getReader();
      void readStream(outReader, 'stdout');

      const unsubServerReady = container.on('server-ready', (_port: number, url: string) => {
        if (abortRef.current || gen !== bootGenRef.current) return;
        addLog(`${label} ready at ${url}`, 'system');
        setPreviewUrl(url);
        setStatus('READY');
      });

      void devProcess.exit.then((code) => {
        unsubServerReady();
        if (!abortRef.current && gen === bootGenRef.current) {
          addLog(`Dev server exited with code ${code}`, 'stderr');
          setStatus('ERROR');
          setError(`Dev server exited unexpectedly (code ${code})`);
        }
      });
    },
    [addLog, readStream],
  );

  const start = useCallback(
    async (files: Record<string, string>, runtime: WCRuntime = 'next') => {
      const gen = ++bootGenRef.current;
      abortRef.current = false;
      lastFilesRef.current = files;
      runtimeRef.current = runtime;
      setError(null);
      setPreviewUrl(null);
      setStatus('BOOTING');
      addLog(`Booting WebContainer (${runtime})...`, 'system');

      try {
        const container = await getWebContainerInstance();

        if (abortRef.current || gen !== bootGenRef.current) return;
        setStatus('MOUNTING');
        addLog('Mounting project files...', 'system');

        const fileTree = buildFileSystemTreeFromRecord(files);
        await container.mount(fileTree);

        if (abortRef.current || gen !== bootGenRef.current) return;
        setStatus('INSTALLING');
        addLog('Running npm install...', 'system');

        const installProcess = await container.spawn('npm', ['install']);
        const installReader = installProcess.output.getReader();
        void readStream(installReader, 'stdout');
        const installExit = await installProcess.exit;

        if (gen !== bootGenRef.current) return;

        if (installExit !== 0) {
          setStatus('ERROR');
          setError(`npm install failed with exit code ${installExit}`);
          addLog(`npm install exited with code ${installExit}`, 'stderr');
          return;
        }

        if (abortRef.current || gen !== bootGenRef.current) return;
        await startDevServer(container, runtime, gen);
      } catch (err) {
        if (abortRef.current || gen !== bootGenRef.current) return;
        const message = err instanceof Error ? err.message : String(err);
        addLog(`WebContainer unavailable: ${message}`, 'system');
        setStatus('IDLE');
        setError(null);
        setPreviewUrl(null);
      }
    },
    [addLog, readStream, startDevServer],
  );

  const clearLogs = useCallback(() => {
    setTerminalLogs([]);
  }, []);

  const retry = useCallback(async () => {
    if (lastFilesRef.current) {
      await start(lastFilesRef.current, runtimeRef.current);
    }
  }, [start]);

  useEffect(() => {
    return () => {
      abortRef.current = true;
      bootGenRef.current += 1;
      if (devProcessRef.current) {
        try {
          devProcessRef.current.kill();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return { previewUrl, status, terminalLogs, error, start, stop, retry, clearLogs };
}
