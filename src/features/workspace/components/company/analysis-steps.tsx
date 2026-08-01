"use client";

import { cn } from "@/lib/utils";

interface AnalysisStep {
  id: string;
  label: string;
  icon: string;
  status: "completed" | "active" | "pending" | "failed";
  detail?: string;
}

interface AnalysisStepsProps {
  steps: AnalysisStep[];
  overallProgress: number;
}

export function AnalysisSteps({ steps, overallProgress }: AnalysisStepsProps) {
  const completedCount = steps.filter((s) => s.status === "completed").length;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <span className="text-[10px] font-medium text-zinc-400 tabular-nums">
          {overallProgress}%
        </span>
      </div>

      {/* Step list */}
      <div className="space-y-1">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
              step.status === "active" && "bg-sky-500/[0.06] border border-sky-500/10",
              step.status === "completed" && "bg-white/[0.01]",
              step.status === "pending" && "opacity-50"
            )}
          >
            <span className="text-sm">{step.icon}</span>
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  "text-xs",
                  step.status === "active" && "font-medium text-white",
                  step.status === "completed" && "text-zinc-400",
                  step.status === "pending" && "text-zinc-600",
                  step.status === "failed" && "text-rose-400"
                )}
              >
                {step.label}
              </span>
              {step.detail && (
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">{step.detail}</p>
              )}
            </div>
            <div className="flex-shrink-0">
              {step.status === "completed" && (
                <span className="text-emerald-400 text-[10px]">✓</span>
              )}
              {step.status === "active" && (
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                  <span className="text-[10px] text-sky-400">In progress</span>
                </div>
              )}
              {step.status === "pending" && (
                <span className="text-[10px] text-zinc-600">Pending</span>
              )}
              {step.status === "failed" && (
                <span className="text-[10px] text-rose-400">Failed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
