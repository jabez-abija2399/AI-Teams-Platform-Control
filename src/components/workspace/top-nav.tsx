'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Settings, Sparkles, Code2, Clock, Layers } from 'lucide-react';
import type { WorkspaceState } from '@/core/workspace/types';
import { PersistentPipelineIndicator } from './persistent-pipeline-indicator';

interface TopNavProps {
  state: WorkspaceState;
  onToggleMode: () => void;
  onTogglePause: () => void;
  onToggleDrawer?: () => void;
  onSelectStage?: (stage: any) => void;
}

export function TopNav({ state, onToggleMode, onTogglePause, onToggleDrawer, onSelectStage }: TopNavProps) {
  return (
    <header className="border-b border-[#3c4949] bg-[#131313] px-5 py-2.5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 text-[#e2e2e2] font-sans">
      {/* Left: Project Info & Brand Title */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-xs font-black text-[#56d9d9] tracking-widest uppercase border border-[#56d9d9]/30 px-2 py-0.5 rounded-sm">
          HIBIR_DEV_AI
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-[#e2e2e2] font-sans">{state.projectName}</h1>
            <span className="font-mono text-[10px] font-bold text-[#56d9d9] bg-[#56d9d9]/10 border border-[#56d9d9]/30 px-2 py-0.5 rounded-sm uppercase tracking-wider">
              {state.currentPhase}
            </span>
          </div>
          <p className="text-[11px] text-[#bbc9c8] mt-0.5 flex items-center gap-1.5 font-mono">
            <Clock className="w-3 h-3 text-[#869393]" />
            ETA: <span className="text-[#e2e2e2] font-medium">{state.estimatedTimeRemaining}</span>
          </p>
        </div>
      </div>

      {/* Center: Persistent Pipeline Indicator */}
      <div className="flex items-center gap-4">
        <PersistentPipelineIndicator onSelectStage={onSelectStage} />
        
        <div className="hidden lg:block w-36 space-y-1">
          <div className="flex items-center justify-between font-mono text-[10px]">
            <span className="text-[#bbc9c8] uppercase tracking-wider">Progress</span>
            <span className="text-[#56d9d9] font-bold">{state.overallProgress}%</span>
          </div>
          <Progress value={state.overallProgress} className="h-1 bg-[#1b1b1b]" />
        </div>
      </div>

      {/* Right: Controls, Context Drawer & Creator/Dev Mode Toggle */}
      <div className="flex items-center gap-2">
        {/* Context & Artifact Drawer Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleDrawer}
          className="border-[#3c4949] text-xs gap-1.5 bg-[#1b1b1b] text-[#e2e2e2] hover:bg-[#2a2a2a] hover:border-[#56d9d9] font-mono rounded-sm"
        >
          <Layers className="w-3.5 h-3.5 text-[#56d9d9]" />
          Context & Artifacts
        </Button>

        {/* Creator / Developer Mode Switcher */}
        <div className="bg-[#1b1b1b] border border-[#3c4949] rounded-sm p-0.5 flex items-center gap-1 font-mono text-xs">
          <button
            onClick={onToggleMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm transition-colors text-[11px] ${
              state.mode === 'creator'
                ? 'bg-[#56d9d9] text-black font-bold'
                : 'text-[#bbc9c8] hover:text-[#e2e2e2]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Creator
          </button>
          <button
            onClick={onToggleMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm transition-colors text-[11px] ${
              state.mode === 'developer'
                ? 'bg-[#00acac] text-black font-bold'
                : 'text-[#bbc9c8] hover:text-[#e2e2e2]'
            }`}
          >
            <Code2 className="w-3 h-3" />
            Developer
          </button>
        </div>

        {/* Pause / Resume Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePause}
          className={`border-[#3c4949] text-xs gap-1.5 font-mono rounded-sm ${
            state.isPaused
              ? 'bg-[#e1824e]/10 text-[#e1824e] border-[#e1824e]/40 hover:bg-[#e1824e]/20'
              : 'bg-[#1b1b1b] text-[#e2e2e2] hover:bg-[#2a2a2a]'
          }`}
        >
          {state.isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 text-[#e1824e] fill-[#e1824e]" />
              Resume
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 text-[#bbc9c8]" />
              Pause
            </>
          )}
        </Button>

        {/* Settings Button */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#bbc9c8] hover:text-[#56d9d9] rounded-sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

