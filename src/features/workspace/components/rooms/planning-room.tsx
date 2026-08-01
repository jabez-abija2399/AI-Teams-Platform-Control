"use client";

import { AIEmployeeGrid } from "../company/ai-employee-card";
import { ActivityFeed } from "../company/activity-feed";
import { ArtifactCard } from "../company/artifact-card";
import { ApprovalDialog } from "../company/approval-dialog";
import { PipelineTimeline } from "../company/pipeline-timeline";
import { RoomHeader } from "../company/room-header";
import { usePipelineContext } from "../../hooks/use-pipeline";

export function PlanningRoom({ projectId }: { projectId: string }) {
  const { state, approve } = usePipelineContext();
  const isApproval = state.phaseStatus === "approval";

  const timelinePhases = state.phases
    .filter(p => p.id !== "completed")
    .map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      agentRole: p.agentRole,
      description: p.status === "active" ? `Currently executing` : undefined,
      progress: p.progress,
    }));

  return (
    <div className="flex h-full flex-col">
      <RoomHeader
        phaseNumber={7}
        totalPhases={12}
        title="Planning Room"
        subtitle={
          isApproval
            ? "Planning approval required"
            : state.phaseStatus === "completed"
              ? "Planning complete"
              : "CEO is creating the execution plan"
        }
        status={isComplete(state) ? "completed" : isApproval ? "approval" : "running"}
      />

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-xs font-semibold text-white mb-3">Project Plan</h3>
              <p className="text-xs text-zinc-400">
                {isComplete(state)
                  ? "The project plan has been created with task breakdown and scheduling."
                  : "CEO is breaking down the project into milestones and tasks."}
              </p>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Pipeline Timeline</h3>
              <PipelineTimeline phases={timelinePhases} />
            </div>

            {state.artifacts.length > 0 && (
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Plan Documents</h3>
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
                  onApprove={() => approve(req.artifactName || "PLANNING_APPROVAL")}
                  onRequestChanges={() => {}}
                  onReject={() => {}}
                />
              );
            })()}

            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Activity Feed</h3>
              <ActivityFeed items={state.activities} />
            </div>
          </div>

          <div className="col-span-4">
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Team</h3>
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
