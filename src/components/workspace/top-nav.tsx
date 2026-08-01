'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Settings, Sparkles, Code2, Clock } from 'lucide-react';
import type { WorkspaceState } from '@/core/workspace/types';

interface TopNavProps {
  state: WorkspaceState;
  onToggleMode: () => void;
  onTogglePause: () => void;
}

export function TopNav({ state, onToggleMode, onTogglePause }: TopNavProps) {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
      {/* Left: Project Info & Current Phase */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white">{state.projectName}</h1>
            <Badge variant="outline" className="border-indigo-500/50 bg-indigo-500/10 text-indigo-400 font-medium">
              {state.currentPhase}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            Estimated Remaining: <span className="text-gray-300 font-medium">{state.estimatedTimeRemaining}</span>
          </p>
        </div>
      </div>

      {/* Center: Overall Progress */}
      <div className="flex-1 max-w-xs space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">Company Progress</span>
          <span className="text-indigo-400 font-bold">{state.overallProgress}%</span>
        </div>
        <Progress value={state.overallProgress} className="h-2 bg-gray-800" />
      </div>

      {/* Right: Controls & Creator/Dev Mode Toggle */}
      <div className="flex items-center gap-3">
        {/* Creator / Developer Mode Switcher */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-1 flex items-center gap-1 text-xs">
          <button
            onClick={onToggleMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              state.mode === 'creator'
                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Creator Mode
          </button>
          <button
            onClick={onToggleMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              state.mode === 'developer'
                ? 'bg-emerald-600 text-white font-medium shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Developer Mode
          </button>
        </div>

        {/* Pause / Resume Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePause}
          className={`border-gray-800 text-xs gap-1.5 ${
            state.isPaused
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20'
              : 'bg-gray-900 text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          {state.isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Resume
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 text-gray-400" />
              Pause
            </>
          )}
        </Button>

        {/* Settings Button */}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
