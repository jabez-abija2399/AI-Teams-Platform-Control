'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImplementationViewer } from './implementation-viewer';
import { Loader2, CheckCircle2, AlertCircle, FileCode2, ClipboardList, XCircle, ExternalLink } from 'lucide-react';
import type { ImplementationReport } from '@/ai/agents/roles/developer/developer.types';
import type { BuildEvent, TaskInfo, TaskStatus } from '@/ai/agents/roles/developer/developer.types';

interface ProgressData {
  phase: 'planning' | 'generating' | 'saving' | 'complete';
  plan?: { tasks: string[]; files: string[]; dependencies: string[]; implementationOrder: string[] };
  completedTasks: number;
  totalTasks: number;
  generatedFiles: string[];
  error?: string;
}

interface DeveloperStatus {
  exists: boolean;
  running: boolean;
  summary?: string;
  taskCount?: number;
  changeCount?: number;
  files?: string[];
  progress?: ProgressData;
}

function formatEta(ms: number): string {
  if (ms <= 0) return '';
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `~${seconds}s remaining`;
  const mins = Math.ceil(seconds / 60);
  return `~${mins}m ${seconds % 60}s remaining`;
}

export function DeveloperChat({ projectId, onComplete }: { projectId: string; onComplete?: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<DeveloperStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SSE / build state
  const [buildEvent, setBuildEvent] = useState<BuildEvent | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const tasksRef = useRef<TaskInfo[]>([]);
  const taskRunningTimers = useRef<Map<string, number>>(new Map());
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  function effectiveStatus(task: TaskInfo): TaskStatus {
    if (task.status === 'done') {
      const startedAt = taskRunningTimers.current.get(task.description);
      if (startedAt && Date.now() - startedAt < 1500) return 'running';
    }
    if (task.status === 'running') {
      taskRunningTimers.current.set(task.description, Date.now());
    }
    return task.status;
  }

  async function checkStatus() {
    try {
      const res = await fetch(`/api/projects/${projectId}/developer-status`);
      const json = await res.json();
      if (json.success) {
        setStatus(json.data);
        if (json.data.running) {
          setBuilding(true);
          connectSSE();
        } else if (json.data.exists) {
          setBuilding(false);
          stopPolling();
        } else {
          setBuilding(false);
          stopPolling();
        }
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  function connectSSE() {
    closeEventSource();
    const source = new EventSource(`/api/ai/developer/stream/${projectId}`);
    eventSourceRef.current = source;

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as BuildEvent;
        setBuildEvent(data);
        if (data.tasks) {
          tasksRef.current = data.tasks;
          setTasks(data.tasks);
        }
        if (data.generatedFiles) setGeneratedFiles(data.generatedFiles);

        if (data.phase === 'complete') {
          setBuilding(false);
          source.close();
          onComplete?.();
          checkStatus();
        }
      } catch {
        // ignore parse errors
      }
    };

    source.addEventListener('done', () => {
      setBuilding(false);
      source.close();
      onComplete?.();
      checkStatus();
    });

    source.onerror = () => {
      source.close();
      startPollingFallback();
    };
  }

  function startPollingFallback() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/developer-status`);
        const json = await res.json();
        if (json.success) {
          setStatus(json.data);
          if (!json.data.running) {
            setBuilding(false);
            onComplete?.();
            stopPolling();
          }
        }
      } catch {
        // ignore
      }
    }, 2000);
  }

  useEffect(() => {
    const init = setTimeout(checkStatus, 0);
    return () => {
      clearTimeout(init);
      closeEventSource();
      stopPolling();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!building) {
      closeEventSource();
      stopPolling();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [building]);

  async function handleRunDeveloper() {
    setBuilding(true);
    setError(null);
    setBuildEvent(null);
    setTasks([]);
    tasksRef.current = [];
    setGeneratedFiles([]);
    try {
      const archRes = await fetch(`/api/projects/${projectId}/architect-status`);
      const archJson = await archRes.json();
      if (!archJson.success || !archJson.data.exists) {
        setError('No architecture found. Run Architect AI first.');
        setBuilding(false);
        return;
      }

      const devRes = await fetch('/api/ai/developer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, architecture: archJson.data.analysis }),
      });
      const devJson = await devRes.json();
      if (devJson.success) {
        connectSSE();
      } else {
        const errMsg = devJson.error?.message ?? 'Developer AI failed';
        setError(`Error (${devRes.status}): ${errMsg}`);
        setBuilding(false);
      }
    } catch {
      setError('Network error');
      setBuilding(false);
    }
  }

  async function handleCancel() {
    try {
      await fetch(`/api/ai/developer/cancel/${projectId}`, { method: 'POST' });
      setBuilding(false);
      setError('Build cancelled');
    } catch {
      setError('Failed to cancel build');
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading developer output...</p>;
  }

  // Building state — show real-time progress from SSE
  if (building || buildEvent) {
    const phase = buildEvent?.phase ?? 'planning';
    const completed = buildEvent?.completedTasks ?? 0;
    const total = buildEvent?.totalTasks ?? 0;
    const displayTasks = tasks.length > 0 ? tasks : tasksRef.current;
    const fileList = generatedFiles;
    const activeTasks = buildEvent?.activeTasks;
    const eventMessage = buildEvent?.message ?? '';
    const eta = buildEvent?.eta ?? 0;
    const isCancelled = buildEvent?.type === 'cancelled';
    const isError = buildEvent?.type === 'error';

    if (isCancelled || isError) {
      return (
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            {isError ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <XCircle className="h-5 w-5 text-yellow-500" />
            )}
            <span className="text-sm font-medium">
              {buildEvent?.message ?? 'Build ended'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleRunDeveloper} size="sm">Retry</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <span className="text-sm font-medium">
              {phase === 'planning' && (eventMessage || 'Developer AI is planning...')}
              {phase === 'generating' && (eventMessage || `Generating code... (${completed}/${total} tasks)`)}
              {phase === 'saving' && 'Saving results...'}
            </span>
          </div>
          <Button onClick={handleCancel} variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
        </div>

        {/* ETA */}
        {eta > 0 && phase === 'generating' && (
          <p className="text-xs text-muted-foreground">{formatEta(eta)}</p>
        )}

        {/* Progress bar */}
        {phase === 'generating' && total > 0 && (
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{completed} of {total} tasks complete</p>
          </div>
        )}

        {/* Active batch */}
        {activeTasks && activeTasks.length > 0 && phase === 'generating' && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Active Batch ({activeTasks.length} task(s))
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {activeTasks.map((task, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-mono">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500 shrink-0" />
                    {task}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Task list */}
        {displayTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="h-4 w-4" />
                Tasks ({displayTasks.filter((t) => t.status === 'done').length}/{displayTasks.length} done)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {displayTasks.map((task, i) => {
                  const est = effectiveStatus(task);
                  const isDone = est === 'done';
                  const isRunning = est === 'running';
                  const isFailed = est === 'failed';
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      {isDone ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                      ) : isRunning ? (
                        <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" />
                      ) : isFailed ? (
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      ) : (
                        <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/30" />
                      )}
                      <span className={
                        isDone ? 'text-green-600' :
                        isRunning ? 'text-foreground font-medium' :
                        isFailed ? 'text-red-500' :
                        'text-muted-foreground/50'
                      }>
                        {task.description}
                        {isDone && task.fileCount !== undefined && (
                          <span className="ml-1.5 text-[10px] text-green-400">+{task.fileCount} file(s)</span>
                        )}
                        {isFailed && (
                          <span className="ml-1.5 text-[10px] text-red-400">failed</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Generated files */}
        {fileList.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <FileCode2 className="h-4 w-4" />
                Generated Files ({fileList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {fileList.map((f) => (
                  <Badge key={f} variant="outline" className="font-mono text-[10px]">{f}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground">You can switch tabs — this keeps running.</p>
      </div>
    );
  }

  // No build yet
  if (!status?.exists) {
    return (
      <div className="space-y-3 p-4 text-center text-sm">
        <p className="text-muted-foreground">No development output yet.</p>
        <Button onClick={handleRunDeveloper} size="sm">Run Developer AI</Button>
        <p className="text-xs text-muted-foreground">Uses the Architect AI output to generate code.</p>
        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-500">
            <AlertCircle className="h-3.5 w-3.5" />{error}
          </div>
        )}
      </div>
    );
  }

  // Completed build — show results
  const report: ImplementationReport = {
    completed: true,
    changedFiles: status.files ?? [],
    issues: [],
    notes: `Implemented ${status.changeCount ?? 0} file change(s) across ${status.taskCount ?? 0} task(s).`,
  };

  return (
    <div className="space-y-4">
      <ImplementationViewer report={report} />
      {status.files && status.files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Changed Files ({status.files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {status.files.map((file) => (
                <li key={file} className="text-muted-foreground flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="font-mono">{file}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <div className="flex items-center gap-2">
        <Button onClick={handleRunDeveloper} size="sm" variant="outline">Regenerate</Button>
        <Button
          onClick={() => {
            window.location.href = `/dashboard/projects/${projectId}/workspace`;
          }}
          size="sm"
          variant="default"
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          Open in Workspace
        </Button>
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span className="text-xs text-green-600">Complete</span>
      </div>
    </div>
  );
}
