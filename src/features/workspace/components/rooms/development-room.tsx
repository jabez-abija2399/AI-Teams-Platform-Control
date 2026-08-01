"use client";

import { AIEmployeeGrid } from "../company/ai-employee-card";
import { ActivityFeed } from "../company/activity-feed";
import { ArtifactCard } from "../company/artifact-card";
import { ApprovalDialog } from "../company/approval-dialog";
import { ProjectHealthBar } from "../company/project-health-bar";
import { PipelineTimeline } from "../company/pipeline-timeline";
import { RoomHeader } from "../company/room-header";
import { usePipelineContext } from "../../hooks/use-pipeline";

interface DevelopmentRoomProps {
  projectId: string;
}

export function DevelopmentRoom({ projectId }: DevelopmentRoomProps) {
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
        phaseNumber={8}
        totalPhases={12}
        title="Development Room"
        subtitle={
          isApproval
            ? "Review requested — approval needed to continue"
            : state.phaseStatus === "completed"
              ? "Development complete"
              : "Autonomous software engineering in progress"
        }
        status={state.phaseStatus === "completed" ? "completed" : isApproval ? "approval" : "running"}
      />

      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <ProjectHealthBar
            progress={state.progress}
            healthScore={state.healthScore}
            currentPhase={state.phases.find(p => p.status === "active")?.name || "In Progress"}
            activeAgents={state.employees.filter(e => e.status === "active").length}
            timeElapsed={state.timeElapsed}
          />
        </div>

        <div className="grid grid-cols-12 gap-0">
          {/* Center — Timeline + Artifacts + Activity */}
          <div className="col-span-8 border-r border-white/[0.06] p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Live Timeline</h3>
            <PipelineTimeline phases={timelinePhases} />

            {state.artifacts.length > 0 && (
              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Generated Artifacts</h3>
                <div className="space-y-2">
                  {state.artifacts.slice(0, 5).map((artifact) => (
                    <ArtifactCard key={artifact.id} artifact={artifact} />
                  ))}
                </div>
              </div>
            )}

            {isApproval && state.approvalRequests[0] && (() => {
              const req = state.approvalRequests[0]!;
              return (
                <div className="mt-4">
                  <ApprovalDialog
                    request={req}
                    onApprove={() => approve(req.artifactName || "DEVELOPMENT_APPROVAL")}
                    onRequestChanges={() => {}}
                    onReject={() => {}}
                  />
                </div>
              );
            })()}

            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Activity Feed</h3>
              <ActivityFeed items={state.activities} />
            </div>
          </div>

          {/* Right — AI Employee Cards */}
          <div className="col-span-4 p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">AI Employees</h3>
            <AIEmployeeGrid employees={state.employees} />
          </div>
        </div>
      </div>
    </div>
  );
}
