"use client";

import { cn } from "@/lib/utils";

export type AIEmployeeStatus = "active" | "idle" | "completed" | "waiting" | "error";

export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: AIEmployeeStatus;
  currentTask?: string;
  confidence?: number;
  progress?: number;
}

const statusConfig: Record<AIEmployeeStatus, { color: string; pulse: boolean; label: string }> = {
  active: { color: "bg-emerald-500", pulse: true, label: "Working" },
  idle: { color: "bg-gray-500", pulse: false, label: "Idle" },
  completed: { color: "bg-sky-500", pulse: false, label: "Completed" },
  waiting: { color: "bg-amber-500", pulse: false, label: "Waiting" },
  error: { color: "bg-rose-500", pulse: false, label: "Error" },
};

export function AIEmployeeCard({ employee }: { employee: AIEmployee }) {
  const config = statusConfig[employee.status];

  return (
    <div
      className={cn(
        "group relative rounded-xl border p-3 transition-all duration-200",
        "bg-white/[0.02] border-white/[0.06]",
        "hover:bg-white/[0.04] hover:border-white/[0.1]",
        employee.status === "active" && "border-emerald-500/20 bg-emerald-500/[0.03]"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] text-lg">
            {employee.avatar}
          </div>
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#09090b]",
              config.color,
              config.pulse && "animate-pulse"
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{employee.name}</span>
            <span className="text-[10px] text-zinc-500">{employee.role}</span>
          </div>

          {employee.currentTask && (
            <p className="mt-1 truncate text-xs text-zinc-400">{employee.currentTask}</p>
          )}

          {employee.confidence !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", config.color)}
                  style={{ width: `${employee.confidence}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500">{employee.confidence}%</span>
            </div>
          )}
        </div>

        <span
          className={cn(
            "flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
            employee.status === "active" && "bg-emerald-500/10 text-emerald-400",
            employee.status === "idle" && "bg-white/[0.05] text-zinc-500",
            employee.status === "completed" && "bg-sky-500/10 text-sky-400",
            employee.status === "waiting" && "bg-amber-500/10 text-amber-400",
            employee.status === "error" && "bg-rose-500/10 text-rose-400"
          )}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

export function AIEmployeeGrid({ employees }: { employees: AIEmployee[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {employees.map((employee) => (
        <AIEmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}
