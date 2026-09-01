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
      <div className="flex items-center justify-center min-h-[650px] bg-[#131313] text-[#e2e2e2] rounded-sm border border-[#3c4949] shadow-2xl">
        <div className="flex flex-col items-center gap-4 p-8 rounded-sm bg-[#1b1b1b] border border-[#3c4949] shadow-2xl">
          <div className="relative flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-[#56d9d9] border-t-transparent animate-spin" />
          </div>
          <div className="text-center font-mono">
            <p className="text-sm font-bold text-[#56d9d9] tracking-wider uppercase">INITIALIZING HIBIRDEV WORKSPACE</p>
            <p className="text-xs text-[#bbc9c8] mt-1">Connecting agent communication channels...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#131313] text-[#e2e2e2] border border-[#3c4949] rounded-sm overflow-hidden shadow-2xl relative font-sans">
      {/* Top Navigation */}
      <TopNav
        state={state}
        onToggleMode={handleToggleMode}
        onTogglePause={handleTogglePause}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        onSelectStage={handleSelectStage}
      />

      {/* Sub-header Navigation Tabs */}
      <div className="flex items-center justify-between px-5 py-2 bg-[#1b1b1b] border-b border-[#3c4949] text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveStageTab('timeline')}
            className={`px-3 py-1.5 rounded-sm transition-colors text-[11px] font-bold ${
              activeStageTab === 'timeline'
                ? 'bg-[#56d9d9] text-black border border-[#76f6f5]'
                : 'text-[#bbc9c8] hover:text-[#e2e2e2] bg-[#131313] border border-[#3c4949]'
            }`}
          >
            Mission Timeline
          </button>
          <button
            onClick={() => setActiveStageTab('verification')}
            className={`px-3 py-1.5 rounded-sm transition-colors text-[11px] font-bold ${
              activeStageTab === 'verification'
                ? 'bg-[#56d9d9] text-black border border-[#76f6f5]'
                : 'text-[#bbc9c8] hover:text-[#e2e2e2] bg-[#131313] border border-[#3c4949]'
            }`}
          >
            Verification Matrix
          </button>
          <button
            onClick={() => setActiveStageTab('history')}
            className={`px-3 py-1.5 rounded-sm transition-colors text-[11px] font-bold ${
              activeStageTab === 'history'
                ? 'bg-[#56d9d9] text-black border border-[#76f6f5]'
                : 'text-[#bbc9c8] hover:text-[#e2e2e2] bg-[#131313] border border-[#3c4949]'
            }`}
          >
            Engineering History Log
          </button>
        </div>
      </div>

      {/* Main Content View with Blueprint Grid */}
      {activeStageTab === 'verification' ? (
        <div className="p-6 flex-1 overflow-y-auto blueprint-grid bg-[#131313]">
          <VerificationStageView projectId={projectId} onProceedToSoftware={() => setActiveStageTab('timeline')} />
        </div>
      ) : activeStageTab === 'history' ? (
        <div className="p-6 flex-1 overflow-y-auto blueprint-grid bg-[#131313]">
          <ProjectHistoryStageView projectId={projectId} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 divide-y lg:divide-y-0 lg:divide-x divide-[#3c4949] blueprint-grid bg-[#131313]">
          <div className="lg:col-span-2 overflow-y-auto max-h-[calc(100vh-270px)]">
            <MissionTimeline timeline={state.timeline} mode={state.mode} />
          </div>
          <div className="lg:col-span-1 overflow-y-auto max-h-[calc(100vh-270px)] bg-[#171d1d]/80">
            <AIEmployeePanel employees={state.employees} mode={state.mode} />
          </div>
        </div>
      )}

      {/* Bottom Company Activity Feed */}
      <div className="border-t border-[#3c4949] bg-[#1b1b1b]">
        <ActivityFeedPanel activities={state.activityFeed} mode={state.mode} />
      </div>

      {/* Sliding Context & Artifact Drawer */}
      <ContextArtifactDrawer projectId={projectId} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}

