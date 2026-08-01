'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cpu, Play, CheckCircle2, AlertOctagon, Activity, Zap, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { AutonomousStatus, ExecutionTimelineEntry } from '@/core/autonomous/types';

interface AutonomousExecutionPanelProps {
  projectId: string;
  mode: 'creator' | 'developer';
}

export function AutonomousExecutionPanel({ projectId, mode }: AutonomousExecutionPanelProps) {
  const [status, setStatus] = useState<AutonomousStatus | null>(null);
  const [timeline, setTimeline] = useState<ExecutionTimelineEntry[]>([]);

  const fetchState = useCallback(async () => {
    try {
      const [statRes, timeRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/autonomous/status`),
        fetch(`/api/projects/${projectId}/autonomous/timeline`),
      ]);

      const statJson = await statRes.json();
      const timeJson = await timeRes.json();

      if (statJson.success && statJson.status) setStatus(statJson.status);
      if (timeJson.success && timeJson.timeline) setTimeline(timeJson.timeline);
    } catch {}
  }, [projectId]);

  useEffect(() => {
    fetchState();
    const timer = setInterval(fetchState, 3000);
    return () => clearInterval(timer);
  }, [fetchState]);

  const handleTick = async () => {
    try {
      await fetch(`/api/projects/${projectId}/autonomous/dispatch`, { method: 'POST' });
      fetchState();
    } catch {}
  };

  if (!status) {
    return (
      <div className="p-6 text-center text-xs text-gray-400">
        Initializing Autonomous Execution Engine...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600/10 border border-purple-500/30 text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Autonomous Execution Engine</h2>
            <p className="text-xs text-gray-400">Parallel worker pool, automated code reviews, conflict detection & retry policies</p>
          </div>
        </div>

        <Button size="sm" onClick={handleTick} className="bg-purple-600 hover:bg-purple-500 text-xs gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          Dispatch Scheduler Tick
        </Button>
      </div>

      {/* Metrics & Worker Pool Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-gray-400">Worker Pool Slots</span>
          <div className="text-xl font-bold text-white">
            {status.activeWorkersCount} / {status.concurrencyLimit} Active
          </div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-gray-400">Worker Utilization</span>
          <div className="text-xl font-bold text-purple-400">{status.workerUtilizationPercentage}%</div>
          <Progress value={status.workerUtilizationPercentage} className="h-1 bg-gray-800" />
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-gray-400">Execution Conflicts</span>
          <div className="text-xl font-bold text-amber-400">{status.conflictsCount}</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-gray-400">Completed Work</span>
          <div className="text-xl font-bold text-emerald-400">{status.completedTasksCount} Tasks</div>
        </div>
      </div>

      {/* Timeline & Queue Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-purple-400" />
          Real-time Execution Timeline
        </h3>

        <div className="space-y-2">
          {timeline.map((entry) => (
            <div
              key={entry.id}
              className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-3.5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <Badge
                  className={`text-xs ${
                    entry.state === 'Completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : entry.state === 'Running'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  }`}
                >
                  {entry.state.toUpperCase()}
                </Badge>

                <div>
                  <h4 className="text-xs font-semibold text-white">{entry.taskTitle}</h4>
                  <p className="text-[11px] text-gray-400">{entry.details}</p>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono text-gray-500 shrink-0">
                <div>{entry.agentRole}</div>
                <div>{entry.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
