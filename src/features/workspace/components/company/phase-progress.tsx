"use client";

import { cn } from "@/lib/utils";

export function PhaseProgress({
  currentPhase,
  totalPhases,
  phases,
}: {
  currentPhase: number;
  totalPhases: number;
  phases: { name: string; status: "completed" | "active" | "pending" }[];
}) {
  return (
    <div className="flex items-center gap-1">
      {phases.map((phase, index) => (
        <div key={index} className="flex items-center">
          <div
            className={cn(
              "group relative h-2 flex-1 min-w-[20px] rounded-full transition-all duration-300",
              phase.status === "completed" && "bg-emerald-500",
              phase.status === "active" && "bg-sky-500 animate-pulse",
              phase.status === "pending" && "bg-white/[0.06]"
            )}
            title={phase.name}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white/[0.1] px-2 py-1 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {phase.name}
            </div>
          </div>
          {index < phases.length - 1 && (
            <div className="h-px w-1 bg-white/[0.06]" />
          )}
        </div>
      ))}
    </div>
  );
}
