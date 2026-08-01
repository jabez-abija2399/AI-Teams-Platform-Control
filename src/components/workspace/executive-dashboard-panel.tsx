'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock, Users, ArrowRight, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { ExecutiveDashboardData } from '@/core/executive/types';

interface ExecutiveDashboardPanelProps {
  projectId: string;
  mode: 'creator' | 'developer';
}

export function ExecutiveDashboardPanel({ projectId, mode }: ExecutiveDashboardPanelProps) {
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/executive/dashboard`);
      const json = await res.json();
      if (json.success && json.dashboard) {
        setData(json.dashboard);
      }
    } catch {}
  }, [projectId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleReplan = async () => {
    try {
      await fetch(`/api/projects/${projectId}/executive/replan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual CEO reorganization requested' }),
      });
      fetchDashboard();
    } catch {}
  };

  if (!data) {
    return (
      <div className="p-6 text-center text-xs text-gray-400">
        Loading CEO Executive Dashboard...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-950 text-white">
      {/* Header & Health Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight">CEO Executive Dashboard</h2>
            <Badge
              className={`text-xs ${
                data.healthStatus === 'healthy'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {data.healthStatus.toUpperCase()} HEALTH ({data.healthScore}/100)
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Strategic milestones, work packages, task dependencies, and workload orchestration</p>
        </div>

        <Button size="sm" onClick={handleReplan} className="bg-indigo-600 hover:bg-indigo-500 text-xs gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Trigger Auto Replanning
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-gray-400">Active Milestones</span>
          <div className="text-xl font-bold text-white">{data.activeMilestonesCount} / {data.milestones.length}</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-gray-400">Blocked Tasks</span>
          <div className="text-xl font-bold text-amber-400">{data.blockedTasksCount}</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-gray-400">Completed Work</span>
          <div className="text-xl font-bold text-emerald-400">{data.completedTasksCount} / {data.totalTasksCount} Tasks</div>
        </div>

        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-gray-400">Est. Completion</span>
          <div className="text-xl font-bold text-indigo-300">{data.estimatedCompletion}</div>
        </div>
      </div>

      {/* Milestones & Task Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Strategic Milestones */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Strategic Milestones</h3>
          <div className="space-y-3">
            {data.milestones.map((ms) => (
              <div key={ms.id} className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white">{ms.title}</h4>
                  <Badge variant="outline" className="text-xs text-indigo-400 border-indigo-500/30">
                    {ms.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">{ms.description}</p>

                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-indigo-400 font-semibold">{ms.completionPercentage}%</span>
                  </div>
                  <Progress value={ms.completionPercentage} className="h-1.5 bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Team Workload Panel */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-400" />
            AI Team Workload Distribution
          </h3>
          <div className="space-y-3">
            {data.agentWorkloads.map((wl) => (
              <div key={wl.agentRole} className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{wl.agentName} ({wl.agentRole})</span>
                  <span className="text-gray-400 font-mono">{wl.assignedTaskCount} Tasks</span>
                </div>
                <Progress value={wl.workloadPercentage} className="h-1.5 bg-gray-800" />
                {wl.activeTasks.length > 0 && (
                  <p className="text-[11px] text-gray-400 truncate">
                    Active: <span className="text-gray-300">{wl.activeTasks.join(', ')}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risks & Executive Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Identified Execution Risks
          </h4>
          <ul className="text-xs text-amber-200 space-y-1 pl-4 list-disc">
            {data.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>

        <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            CEO Executive Recommendations
          </h4>
          <ul className="text-xs text-indigo-200 space-y-1 pl-4 list-disc">
            {data.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
