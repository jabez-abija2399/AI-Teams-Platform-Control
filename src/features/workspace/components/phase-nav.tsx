"use client";

import { cn } from "@/lib/utils";
import type { PipelinePhaseId } from "./rooms/room-router";

interface PhaseNavProps {
  currentPhase: PipelinePhaseId;
  onPhaseChange: (phase: PipelinePhaseId) => void;
}

const phases: { id: PipelinePhaseId; label: string; shortLabel: string; icon: string }[] = [
  { id: "discovery", label: "Discovery", shortLabel: "Disc", icon: "🔍" },
  { id: "clarification", label: "Clarification", shortLabel: "Clar", icon: "❓" },
  { id: "proposal", label: "Proposal", shortLabel: "Prop", icon: "📄" },
  { id: "strategy", label: "Strategy", shortLabel: "Strat", icon: "🎯" },
  { id: "product", label: "Product", shortLabel: "Prod", icon: "📋" },
  { id: "architecture", label: "Architecture", shortLabel: "Arch", icon: "🏗️" },
  { id: "planning", label: "Planning", shortLabel: "Plan", icon: "📅" },
  { id: "development", label: "Development", shortLabel: "Dev", icon: "💻" },
  { id: "review", label: "Review", shortLabel: "Rev", icon: "📝" },
  { id: "deployment", label: "Deployment", shortLabel: "Deploy", icon: "🚀" },
  { id: "completed", label: "Complete", shortLabel: "Done", icon: "🎉" },
];

export function PhaseNav({ currentPhase, onPhaseChange }: PhaseNavProps) {
  const currentIndex = phases.findIndex((p) => p.id === currentPhase);

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-white/[0.06]">
      {phases.map((phase, index) => {
        const isActive = phase.id === currentPhase;
        const isPast = index < currentIndex;

        return (
          <button
            key={phase.id}
            onClick={() => onPhaseChange(phase.id)}
            className={cn(
              "group relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all",
              isActive && "bg-white/[0.06] text-white",
              isPast && "text-emerald-400 hover:bg-white/[0.03]",
              !isActive && !isPast && "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03]"
            )}
          >
            <span className="text-xs">{phase.icon}</span>
            <span className="hidden lg:inline">{phase.label}</span>
            <span className="lg:hidden">{phase.shortLabel}</span>

            {isPast && (
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            {isActive && (
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
