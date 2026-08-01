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
    <div className="flex items-center gap-6 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Progress</div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-white">{progress}%</span>
        </div>
      </div>

      <div className="h-6 w-px bg-white/[0.06]" />

      {/* Health Score */}
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Health</div>
        <span
          className={cn(
            "text-sm font-bold",
            healthScore >= 90 ? "text-emerald-400" : healthScore >= 70 ? "text-amber-400" : "text-rose-400"
          )}
        >
          {healthScore}
        </span>
      </div>

      <div className="h-6 w-px bg-white/[0.06]" />

      {/* Current Phase */}
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Phase</div>
        <span className="text-xs text-white">{currentPhase}</span>
      </div>

      <div className="h-6 w-px bg-white/[0.06]" />

      {/* Active Agents */}
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Agents</div>
        <span className="text-xs text-white">{activeAgents} active</span>
      </div>

      <div className="h-6 w-px bg-white/[0.06]" />

      {/* Time */}
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Time</div>
        <span className="text-xs text-white">{timeElapsed}</span>
      </div>
    </div>
  );
}
