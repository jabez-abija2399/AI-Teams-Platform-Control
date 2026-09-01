"use client";

import { AIEmployeeGrid } from "../company/ai-employee-card";
import { ArtifactCard } from "../company/artifact-card";
import { ApprovalDialog } from "../company/approval-dialog";
import { RoomHeader } from "../company/room-header";
import { usePipelineContext } from "../../hooks/use-pipeline";

export function DesignRoom({ projectId }: { projectId: string }) {
  const { state, approve } = usePipelineContext();
  const isApproval = state.phaseStatus === "approval";

  return (
    <div className="flex h-full flex-col font-sans">
      <RoomHeader
        phaseNumber={7}
        totalPhases={12}
        title="UI / UX Design Room"
        subtitle="UI Designer is designing the user experience, component hierarchy, and design tokens"
        status={isApproval ? "approval" : state.phaseStatus === "completed" ? "completed" : "running"}
      />

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <div className="mb-4 rounded-xl border border-border bg-white/[0.02] p-5">
              <h3 className="text-xs font-semibold text-foreground mb-4">UI / UX Design Specification</h3>
              <p className="text-xs text-muted-foreground">
                UI/UX Designer Agent is defining visual tokens, component hierarchy, responsive layouts, interaction states, and WCAG accessibility standards.
              </p>
            </div>

            {state.artifacts.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Generated Artifacts</h3>
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
                    onApprove={() => approve(req.artifactName || "DESIGN_SPEC")}
                    onRequestChanges={() => {}}
                    onReject={() => {}}
                  />
                </div>
              );
            })()}
          </div>

          <div className="col-span-4">
            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Team Status</h3>
            <AIEmployeeGrid employees={state.employees} />
          </div>
        </div>
      </div>
    </div>
  );
}
