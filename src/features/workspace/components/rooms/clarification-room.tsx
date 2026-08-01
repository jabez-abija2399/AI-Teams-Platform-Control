"use client";

import { AIEmployeeGrid } from "../company/ai-employee-card";
import { ArtifactCard } from "../company/artifact-card";
import { ApprovalDialog } from "../company/approval-dialog";
import { RoomHeader } from "../company/room-header";
import { usePipelineContext } from "../../hooks/use-pipeline";

export function ClarificationRoom({ projectId }: { projectId: string }) {
  const { state, approve } = usePipelineContext();
  const isApproval = state.phaseStatus === "approval";

  return (
    <div className="flex h-full flex-col">
      <RoomHeader
        phaseNumber={2}
        totalPhases={12}
        title="Clarification Room"
        subtitle="Product Manager is gathering requirements"
        status={state.phaseStatus === "completed" ? "completed" : "running"}
      />

      <div className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-white/[0.05] text-2xl mb-3">📋</div>
            <h3 className="text-sm font-semibold text-white">Gathering Requirements</h3>
            <p className="mt-1 text-xs text-zinc-400">The Product Manager is clarifying requirements for your product.</p>
          </div>

          {/* Show artifacts */}
          {state.artifacts.length > 0 && (
            <div className="space-y-2">
              {state.artifacts.map((artifact) => (
                <ArtifactCard key={artifact.id} artifact={artifact} />
              ))}
            </div>
          )}

          {/* Show approval */}
          {isApproval && state.approvalRequests[0] && (() => {
            const req = state.approvalRequests[0]!;
            return (
              <div className="mt-4">
                <ApprovalDialog
                  request={req}
                  onApprove={() => approve(req.artifactName || "CLARIFICATION_APPROVAL")}
                  onRequestChanges={() => {}}
                  onReject={() => {}}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
