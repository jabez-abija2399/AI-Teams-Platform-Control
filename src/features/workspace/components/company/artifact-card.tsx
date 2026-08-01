"use client";

import { cn } from "@/lib/utils";

export interface Artifact {
  id: string;
  name: string;
  type: string;
  createdBy: string;
  createdAt: Date | string;
  status: "draft" | "review" | "approved" | "rejected";
  summary?: string;
  score?: number;
}

const statusConfig: Record<Artifact["status"], { color: string; label: string }> = {
  draft: { color: "bg-zinc-500/10 text-zinc-400", label: "Draft" },
  review: { color: "bg-amber-500/10 text-amber-400", label: "In Review" },
  approved: { color: "bg-emerald-500/10 text-emerald-400", label: "Approved" },
  rejected: { color: "bg-rose-500/10 text-rose-400", label: "Rejected" },
};

export function ArtifactCard({
  artifact,
  onView,
}: {
  artifact: Artifact;
  onView?: () => void;
}) {
  const config = statusConfig[artifact.status];

  return (
    <div
      className={cn(
        "group rounded-xl border p-4 transition-all duration-200",
        "bg-white/[0.02] border-white/[0.06]",
        "hover:bg-white/[0.04] hover:border-white/[0.1]"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] text-lg">
            📄
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">{artifact.name}</h4>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              {artifact.type} • by {artifact.createdBy}
            </p>
          </div>
        </div>
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", config.color)}>
          {config.label}
        </span>
      </div>

      {artifact.summary && (
        <p className="mt-3 text-xs text-zinc-400 line-clamp-2">{artifact.summary}</p>
      )}

      {artifact.score !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                artifact.score >= 90 ? "bg-emerald-500" : artifact.score >= 70 ? "bg-amber-500" : "bg-rose-500"
              )}
              style={{ width: `${artifact.score}%` }}
            />
          </div>
          <span className="text-[10px] text-zinc-500">{artifact.score}/100</span>
        </div>
      )}

      {onView && (
        <button
          onClick={onView}
          className="mt-3 text-xs text-sky-400 hover:text-sky-300 transition-colors"
        >
          View Artifact →
        </button>
      )}
    </div>
  );
}
