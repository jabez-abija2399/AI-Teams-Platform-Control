"use client";

import { AIEmployeeGrid } from "../company/ai-employee-card";
import { ApprovalDialog } from "../company/approval-dialog";
import { RoomHeader } from "../company/room-header";
import { usePipelineContext } from "../../hooks/use-pipeline";

export function ProductRoom({ projectId }: { projectId: string }) {
  const { state, approve } = usePipelineContext();
  const isApproval = state.phaseStatus === "approval";

  const columns = ["ideas", "planned", "building", "testing", "completed"] as const;

  return (
    <div className="flex h-full flex-col">
      <RoomHeader
        phaseNumber={5}
        totalPhases={12}
        title="Product Management Room"
        subtitle="Product Manager is organizing the backlog"
        status={isApproval ? "approval" : state.phaseStatus === "completed" ? "completed" : "running"}
      />

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-10">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs text-zinc-400">Product Manager is organizing the feature backlog and creating the PRD.</p>
            </div>

            {state.artifacts.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Documents</h3>
                {state.artifacts.map((artifact) => (
                  <div key={artifact.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                    <span className="text-xs font-medium text-white">{artifact.name}</span>
                    <span className="ml-2 text-[10px] text-zinc-500">by {artifact.createdBy}</span>
                  </div>
                ))}
              </div>
            )}

            {isApproval && state.approvalRequests[0] && (() => {
              const req = state.approvalRequests[0]!;
              return (
                <div className="mt-4">
                  <ApprovalDialog
                    request={req}
                    onApprove={() => approve(req.artifactName || "PRODUCT_BACKLOG_APPROVAL")}
                    onRequestChanges={() => {}}
                    onReject={() => {}}
                  />
                </div>
              );
            })()}
          </div>

          <div className="col-span-2">
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Team</h3>
            <AIEmployeeGrid employees={state.employees} />
          </div>
        </div>
      </div>
    </div>
  );
}
