'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreatorExperienceService } from '../services/creator-experience.service';
import { ExecutionProgressMapper } from '../services/execution-progress.mapper';
import { 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  Hammer, 
  Palette, 
  FlaskConical, 
  Rocket, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';

interface AnimatedProgressTimelineProps {
  status: string;
  progress: number;
  terminalLogs?: Array<{ message: string }>;
  isDeveloperMode: boolean;
  onToggleDeveloperMode: () => void;
}

const ICON_MAP = {
  workspace: Hammer,
  design: Palette,
  build: Layers,
  quality: FlaskConical,
  preview: Rocket,
  ready: CheckCircle2,
  error: AlertTriangle,
};

export function AnimatedProgressTimeline({
  status,
  progress,
  terminalLogs = [],
  isDeveloperMode,
  onToggleDeveloperMode,
}: AnimatedProgressTimelineProps) {
  const creatorState = CreatorExperienceService.calculateProgressState(status, progress, terminalLogs);

  return (
    <div className="space-y-4 w-full">
      {/* Header Bar with Creator / Dev Toggle */}
      <div className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-500">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold leading-none">Creator Experience</h4>
            <p className="text-[11px] text-muted-foreground">Human-friendly build orchestrator</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleDeveloperMode}
          className="text-xs h-7 gap-1.5"
        >
          {isDeveloperMode ? (
            <>
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              Switch to Creator View
            </>
          ) : (
            <>
              <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              Developer Mode
            </>
          )}
        </Button>
      </div>

      {/* Main Creator Mode Visual Progress Card */}
      <Card className="border bg-gradient-to-br from-background via-card to-muted/20 shadow-sm overflow-hidden">
        <CardContent className="p-5 space-y-6">
          {/* Top Status & Estimated Completion */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  {creatorState.friendlyTitle}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">{creatorState.friendlyDescription}</p>
            </div>

            {!creatorState.isCompleted && !creatorState.hasError && (
              <Badge variant="secondary" className="px-3 py-1 text-xs font-mono flex items-center gap-1.5 shrink-0 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
                <Clock className="h-3.5 w-3.5 animate-spin" />
                Est. {creatorState.estimatedSecondsRemaining}s remaining
              </Badge>
            )}
          </div>

          {/* Smooth Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-muted-foreground">{creatorState.currentStage.stageName}</span>
              <span className="text-primary font-mono">{Math.round(creatorState.progressPercent)}%</span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-3 p-0.5 border overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${Math.min(100, Math.max(0, creatorState.progressPercent))}%` }}
              />
            </div>
          </div>

          {/* Milestone Step Flow Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
            {creatorState.milestones.map((m) => {
              const stageKey = ExecutionProgressMapper.getStageMapping(m.id).iconName;
              const Icon = (ICON_MAP as Record<string, any>)[stageKey] || Layers;
              const isCurrent = m.status === 'current';
              const isCompleted = m.status === 'completed';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col p-3 rounded-lg border transition-all duration-300 relative ${
                    isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : isCurrent
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500/20'
                      : 'bg-card/50 border-border/50 text-muted-foreground opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className={`p-2 rounded-md ${
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-indigo-500 text-white animate-pulse'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                    {m.stageName}
                  </span>
                  <p className="text-xs font-semibold leading-tight line-clamp-2">{m.friendlyTitle}</p>
                </div>
              );
            })}
          </div>

          {/* Recent Friendly Events Feed */}
          {creatorState.friendlyLogs.length > 0 && (
            <div className="bg-muted/30 p-3 rounded-lg border text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block mb-1">
                Recent AI Accomplishments
              </span>
              {creatorState.friendlyLogs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2 text-foreground/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
