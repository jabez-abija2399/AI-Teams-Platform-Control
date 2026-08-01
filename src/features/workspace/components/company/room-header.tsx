"use client";

import { cn } from "@/lib/utils";

export function RoomHeader({
  phaseNumber,
  totalPhases,
  title,
  subtitle,
  status,
}: {
  phaseNumber: number;
  totalPhases: number;
  title: string;
  subtitle?: string;
  status: "running" | "completed" | "waiting" | "approval";
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
            status === "running" && "bg-sky-500/10 text-sky-400",
            status === "completed" && "bg-emerald-500/10 text-emerald-400",
            status === "waiting" && "bg-white/[0.05] text-zinc-500",
            status === "approval" && "bg-amber-500/10 text-amber-400"
          )}
        >
          {status === "completed" ? "✓" : phaseNumber}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-[10px] text-zinc-500">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] text-zinc-600">
          Phase {phaseNumber}/{totalPhases}
        </span>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium",
            status === "running" && "bg-sky-500/10 text-sky-400",
            status === "completed" && "bg-emerald-500/10 text-emerald-400",
            status === "waiting" && "bg-white/[0.05] text-zinc-500",
            status === "approval" && "bg-amber-500/10 text-amber-400"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status === "running" && "bg-sky-400 animate-pulse",
              status === "completed" && "bg-emerald-400",
              status === "waiting" && "bg-zinc-500",
              status === "approval" && "bg-amber-400 animate-pulse"
            )}
          />
          {status === "running" ? "In Progress" : status === "completed" ? "Complete" : status === "waiting" ? "Waiting" : "Approval Required"}
        </div>
      </div>
    </div>
  );
}
