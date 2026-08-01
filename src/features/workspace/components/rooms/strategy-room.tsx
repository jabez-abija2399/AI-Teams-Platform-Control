"use client";

import { AIEmployeeGrid } from "../company/ai-employee-card";
import { ArtifactCard } from "../company/artifact-card";
import { ApprovalDialog } from "../company/approval-dialog";
import { RoomHeader } from "../company/room-header";
import { usePipelineContext } from "../../hooks/use-pipeline";

export function StrategyRoom({ projectId }: { projectId: string }) {
  const { state, approve } = usePipelineContext();
  const isApproval = state.phaseStatus === "approval";

  return (
    <div className="flex h-full flex-col">
      <RoomHeader
        phaseNumber={4}
        totalPhases={12}
        title="Strategy Room"
        subtitle="CEO is organizing company resources"
        status={isApproval ? "approval" : state.phaseStatus === "completed" ? "completed" : "running"}
      />

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.05] text-lg">👔</div>
                <div>
                  <h3 className="text-sm font-semibold text-white">CEO AI</h3>
                  <p className="text-[10px] text-zinc-500">Strategy {state.phaseStatus === "completed" ? "Complete" : "In Progress"}</p>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {state.phaseStatus === "completed"
                  ? "The product vision is approved. I have organized company resources and created a comprehensive execution strategy."
                  : "I am analyzing the product vision and organizing the execution strategy."}
              </p>
            </div>

            {state.artifacts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Strategy Documents</h3>
                {state.artifacts.map((artifact) => (
                  <ArtifactCard key={artifact.id} artifact={artifact} />
                ))}
              </div>
            )}

          {isApproval && state.approvalRequests[0] && (() => {
            const req = state.approvalRequests[0]!;
            return (
              <div className="mt-4">
                <ApprovalDialog
                  request={req}
                  onApprove={() => approve(req.artifactName || "STRATEGY_APPROVAL")}
                  onRequestChanges={() => {}}
                  onReject={() => {}}
                />
              </div>
            );
          })()}
          </div>

          <div className="col-span-4">
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Team Status</h3>
            <AIEmployeeGrid employees={state.employees} />
          </div>
        </div>
      </div>
    </div>
  );
}
