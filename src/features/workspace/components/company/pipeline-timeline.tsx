"use client";

import { cn } from "@/lib/utils";

export interface PipelinePhase {
  id: string;
  name: string;
  status: "completed" | "active" | "pending" | "failed";
  agentRole?: string;
  description?: string;
  progress?: number;
}

export function PipelineTimeline({ phases }: { phases: PipelinePhase[] }) {
  return (
    <div className="space-y-0">
      {phases.map((phase, index) => (
        <div key={phase.id} className="flex gap-3">
          {/* Timeline line + dot */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0",
                phase.status === "completed" && "bg-emerald-500/20 text-emerald-400",
                phase.status === "active" && "bg-sky-500/20 text-sky-400 ring-2 ring-sky-500/30",
                phase.status === "pending" && "bg-white/[0.05] text-zinc-600",
                phase.status === "failed" && "bg-rose-500/20 text-rose-400"
              )}
            >
              {phase.status === "completed" ? "✓" : phase.status === "active" ? "●" : phase.status === "failed" ? "✗" : "○"}
            </div>
            {index < phases.length - 1 && (
              <div
                className={cn(
                  "w-px flex-1 min-h-[20px]",
                  phase.status === "completed" ? "bg-emerald-500/30" : "bg-white/[0.06]"
                )}
              />
            )}
          </div>

          {/* Phase content */}
          <div className={cn("pb-4 flex-1 min-w-0", phase.status === "pending" && "opacity-50")}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-xs font-medium",
                  phase.status === "active" ? "text-white" : "text-zinc-400"
                )}
              >
                {phase.name}
              </span>
              {phase.agentRole && (
                <span className="text-[10px] text-zinc-600">• {phase.agentRole}</span>
              )}
            </div>
            {phase.description && (
              <p className="mt-0.5 text-[10px] text-zinc-500">{phase.description}</p>
            )}
            {phase.status === "active" && phase.progress !== undefined && (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all duration-500"
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
