"use client";

import { AIEmployeeGrid } from "../company/ai-employee-card";
import { ActivityFeed } from "../company/activity-feed";
import { ArtifactCard } from "../company/artifact-card";
import { ApprovalDialog } from "../company/approval-dialog";
import { RoomHeader } from "../company/room-header";
import { usePipelineContext } from "../../hooks/use-pipeline";

export function ProposalRoom({ projectId }: { projectId: string }) {
  const { state, approve } = usePipelineContext();
  const isApproval = state.phaseStatus === "approval";

  return (
    <div className="flex h-full flex-col">
      <RoomHeader
        phaseNumber={3}
        totalPhases={12}
        title="Product Proposal Room"
        subtitle={
          isApproval
            ? "Product Manager needs approval to proceed"
            : state.phaseStatus === "completed"
              ? "Proposal complete"
              : "Product Manager is crafting the proposal"
        }
        status={isComplete(state) ? "completed" : isApproval ? "approval" : "running"}
      />

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Center — Proposal content */}
          <div className="col-span-8 space-y-4">
            <div className="rounded-xl border border-border bg-white/[0.02] p-5">
              <h3 className="text-xs font-semibold text-foreground mb-3">Product Proposal</h3>
              <p className="text-xs text-muted-foreground">
                {isComplete(state)
                  ? "The product proposal has been generated and is ready for review."
                  : "Product Manager is analyzing requirements and creating a comprehensive proposal."}
              </p>
            </div>

            {state.artifacts.length > 0 && (
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Generated Documents</h3>
                <div className="space-y-2">
                  {state.artifacts.map((artifact) => (
                    <ArtifactCard key={artifact.id} artifact={artifact} />
                  ))}
                </div>
              </div>
            )}

            {isApproval && state.approvalRequests[0] && (() => {
              const req = state.approvalRequests[0]!;
              return (
                <ApprovalDialog
                  request={req}
                  onApprove={() => approve(req.artifactName || "PRODUCT_APPROVAL")}
                  onRequestChanges={() => {}}
                  onReject={() => {}}
                />
              );
            })()}

            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Activity Feed</h3>
              <ActivityFeed items={state.activities} />
            </div>
          </div>

          {/* Right — Team */}
          <div className="col-span-4">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Team</h3>
            <AIEmployeeGrid employees={state.employees} />
          </div>
        </div>
      </div>
    </div>
  );
}

function isComplete(state: { phaseStatus: string }) {
  return state.phaseStatus === "completed";
}
