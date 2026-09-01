'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TopNav } from './top-nav';
import { MissionTimeline } from './mission-timeline';
import { AIEmployeePanel } from './ai-employee-panel';
import { ActivityFeedPanel } from './activity-feed-panel';
import { ContextArtifactDrawer } from './context-artifact-drawer';
import { VerificationStageView } from './stages/verification-stage-view';
import { ProjectHistoryStageView } from './stages/project-history-stage-view';
import type { WorkspaceState } from '@/core/workspace/types';

export function MissionControlWorkspace({
  projectId,
  projectName = 'AI SaaS Platform',
}: {
  projectId: string;
  projectName?: string;
}) {
  const [state, setState] = useState<WorkspaceState | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeStageTab, setActiveStageTab] = useState<'timeline' | 'verification' | 'history'>('timeline');
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/workspace`);
      const json = await res.json();
      if (json.success && json.state) {
        setState(json.state);
      }
    } catch {}
  }, [projectId]);

  useEffect(() => {
    fetchState();

    const eventSource = new EventSource(`/api/projects/${projectId}/execution/stream`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('pipeline_event', () => {
      fetchState();
    });

    eventSource.addEventListener('timeline_event', () => {
      fetchState();
    });

    eventSource.onerror = () => {
      eventSource.close();
      const fallback = setInterval(fetchState, 5000);
      return () => clearInterval(fallback);
    };

    return () => {
      eventSource.close();
    };
  }, [fetchState, projectId]);

  const handleToggleMode = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/workspace/toggle-mode`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setState((prev) => (prev ? { ...prev, mode: json.mode } : null));
      }
    } catch {}
  };

  const handleTogglePause = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/workspace/pause`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setState((prev) => (prev ? { ...prev, isPaused: json.isPaused } : null));
      }
    } catch {}
  };

  const handleSelectStage = (stage: string) => {
    if (stage === 'DEVELOPER') {
      setActiveStageTab('verification');
    } else {
      setActiveStageTab('timeline');
    }
  };

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[650px] bg-gradient-to-br from-gray-950 via-slate-950 to-indigo-950/30 text-white rounded-2xl border border-white/10 shadow-2xl backdrop-blur-3xl">
        <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-black/40 border border-white/10 shadow-2xl">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <div className="absolute w-8 h-8 rounded-full border-2 border-purple-500 border-b-transparent animate-spin-reverse opacity-70" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-white tracking-wide">Initializing AI Company Workspace</p>
            <p className="text-xs text-indigo-400 mt-1 font-mono">Connecting neural agent communication channels...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-950 via-slate-950/95 to-indigo-950/20 text-white border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-3xl relative">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-75" />

      {/* Top Navigation */}
      <TopNav
        state={state}
        onToggleMode={handleToggleMode}
        onTogglePause={handleTogglePause}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        onSelectStage={handleSelectStage}
      />

      {/* Sub-header Navigation Tabs */}
      <div className="flex items-center justify-between px-6 py-2 bg-black/30 border-b border-white/5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveStageTab('timeline')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeStageTab === 'timeline'
                ? 'bg-indigo-600/30 text-indigo-300 font-bold border border-indigo-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mission Timeline
          </button>
          <button
            onClick={() => setActiveStageTab('verification')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeStageTab === 'verification'
                ? 'bg-emerald-600/30 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Verification Matrix
          </button>
          <button
            onClick={() => setActiveStageTab('history')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeStageTab === 'history'
                ? 'bg-purple-600/30 text-purple-300 font-bold border border-purple-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Engineering History Log
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {activeStageTab === 'verification' ? (
        <div className="p-6 flex-1 overflow-y-auto">
          <VerificationStageView projectId={projectId} onProceedToSoftware={() => setActiveStageTab('timeline')} />
        </div>
      ) : activeStageTab === 'history' ? (
        <div className="p-6 flex-1 overflow-y-auto">
          <ProjectHistoryStageView projectId={projectId} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          <div className="lg:col-span-2 overflow-y-auto max-h-[calc(100vh-270px)] custom-scrollbar">
            <MissionTimeline timeline={state.timeline} mode={state.mode} />
          </div>
          <div className="lg:col-span-1 overflow-y-auto max-h-[calc(100vh-270px)] custom-scrollbar bg-black/20">
            <AIEmployeePanel employees={state.employees} mode={state.mode} />
          </div>
        </div>
      )}

      {/* Bottom Company Activity Feed */}
      <div className="border-t border-white/10 bg-black/40 backdrop-blur-md">
        <ActivityFeedPanel activities={state.activityFeed} mode={state.mode} />
      </div>

      {/* Sliding Context & Artifact Drawer */}
      <ContextArtifactDrawer projectId={projectId} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}

