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
  draft: { color: "bg-muted text-muted-foreground", label: "Draft" },
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
        "bg-white/[0.02] border-border",
        "hover:bg-muted/60 hover:border-primary/20"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
            📄
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">{artifact.name}</h4>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {artifact.type} • by {artifact.createdBy}
            </p>
          </div>
        </div>
        <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", config.color)}>
          {config.label}
        </span>
      </div>

      {artifact.summary && (
        <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{artifact.summary}</p>
      )}

      {artifact.score !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                artifact.score >= 90 ? "bg-emerald-500" : artifact.score >= 70 ? "bg-amber-500" : "bg-rose-500"
              )}
              style={{ width: `${artifact.score}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{artifact.score}/100</span>
        </div>
      )}

      {onView && (
        <button
          onClick={onView}
          className="mt-3 text-xs text-primary hover:text-sky-300 transition-colors"
        >
          View Artifact →
        </button>
      )}
    </div>
  );
}
