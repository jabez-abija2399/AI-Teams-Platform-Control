"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  artifactName?: string;
  urgency: "normal" | "high" | "critical";
}

export function ApprovalDialog({
  request,
  onApprove,
  onReject,
  onRequestChanges,
}: {
  request: ApprovalRequest;
  onApprove: () => void;
  onReject: () => void;
  onRequestChanges?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        "bg-gradient-to-b from-amber-500/[0.05] to-transparent border-amber-500/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-lg">
          ⚠️
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">{request.title}</h3>
          <p className="mt-1 text-xs text-zinc-400">{request.description}</p>
          {request.artifactName && (
            <p className="mt-2 text-[10px] text-zinc-500">
              Artifact: <span className="text-zinc-400">{request.artifactName}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          onClick={onApprove}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
        >
          Approve
        </Button>
        {onRequestChanges && (
          <Button
            onClick={onRequestChanges}
            variant="outline"
            className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.05] text-xs h-8"
          >
            Request Changes
          </Button>
        )}
        <Button
          onClick={onReject}
          variant="ghost"
          className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs h-8"
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
