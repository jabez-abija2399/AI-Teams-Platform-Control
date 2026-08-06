"use client";

import { cn } from "@/lib/utils";

export function ProjectHealthBar({
  progress,
  healthScore,
  currentPhase,
  activeAgents,
  timeElapsed,
}: {
  progress: number;
  healthScore: number;
  currentPhase: string;
  activeAgents: number;
  timeElapsed: string;
}) {
  return (
    <div className="flex items-center gap-6 rounded-xl border border-border bg-white/[0.02] px-5 py-3">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Progress</div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-foreground">{progress}%</span>
        </div>
      </div>

      <div className="h-6 w-px bg-muted" />

      {/* Health Score */}
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Health</div>
        <span
          className={cn(
            "text-sm font-bold",
            healthScore >= 90 ? "text-emerald-400" : healthScore >= 70 ? "text-amber-400" : "text-rose-400"
          )}
        >
          {healthScore}
        </span>
      </div>

      <div className="h-6 w-px bg-muted" />

      {/* Current Phase */}
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Phase</div>
        <span className="text-xs text-foreground">{currentPhase}</span>
      </div>

      <div className="h-6 w-px bg-muted" />

      {/* Active Agents */}
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Agents</div>
        <span className="text-xs text-foreground">{activeAgents} active</span>
      </div>

      <div className="h-6 w-px bg-muted" />

      {/* Time */}
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Time</div>
        <span className="text-xs text-foreground">{timeElapsed}</span>
      </div>
    </div>
  );
}
