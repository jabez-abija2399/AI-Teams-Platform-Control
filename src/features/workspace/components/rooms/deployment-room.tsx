"use client";

import { cn } from "@/lib/utils";
import { AIEmployeeGrid } from "../company/ai-employee-card";
import { ActivityFeed } from "../company/activity-feed";
import { ArtifactCard } from "../company/artifact-card";
import { ApprovalDialog } from "../company/approval-dialog";
import { RoomHeader } from "../company/room-header";
import { usePipelineContext } from "../../hooks/use-pipeline";

export function DeploymentRoom({ projectId }: { projectId: string }) {
  const { state, approve } = usePipelineContext();
  const isComplete = state.phaseStatus === "completed";
  const isApproval = state.phaseStatus === "approval";
  const isActive = state.phaseStatus === "running";

  const deploySteps = [
    { name: "Development", status: "completed" as const },
    { name: "Testing", status: "completed" as const },
    { name: "Security Scan", status: state.progress > 80 ? "completed" as const : isActive ? "active" as const : "pending" as const },
    { name: "Production Deploy", status: isComplete ? "completed" as const : isActive ? "active" as const : "pending" as const },
  ];

  return (
    <div className="flex h-full flex-col">
      <RoomHeader
        phaseNumber={10}
        totalPhases={12}
        title="Deployment Room"
        subtitle={
          isComplete
            ? "Deployment successful"
            : isApproval
              ? "Deployment approval required"
              : "DevOps Engineer is deploying your product"
        }
        status={isComplete ? "completed" : isApproval ? "approval" : "running"}
      />

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Center — Deploy steps + artifacts + activity */}
          <div className="col-span-8 space-y-4">
            {/* Deploy Progress */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="text-xs font-semibold text-white mb-4">
                {isComplete ? "Deployment Complete" : "Deployment Progress"}
              </h3>
              <div className="space-y-2">
                {deploySteps.map((step, index) => (
                  <div key={step.name} className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                      step.status === "completed" && "bg-emerald-500/20 text-emerald-400",
                      step.status === "active" && "bg-sky-500/20 text-sky-400 animate-pulse",
                      step.status === "pending" && "bg-white/[0.05] text-zinc-600"
                    )}>
                      {step.status === "completed" ? "✓" : index + 1}
                    </div>
                    <span className={cn(
                      "text-sm",
                      step.status === "completed" ? "text-emerald-400" : step.status === "active" ? "text-white" : "text-zinc-600"
                    )}>
                      {step.name}
                    </span>
                    {step.status === "active" && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />}
                  </div>
                ))}
              </div>
            </div>

            {isApproval && state.approvalRequests[0] && (() => {
              const req = state.approvalRequests[0]!;
              return (
                <ApprovalDialog
                  request={req}
                  onApprove={() => approve(req.artifactName || "DEPLOYMENT_APPROVAL")}
                  onRequestChanges={() => {}}
                  onReject={() => {}}
                />
              );
            })()}

            {state.artifacts.length > 0 && (
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Deployment Artifacts</h3>
                <div className="space-y-2">
                  {state.artifacts.slice(0, 3).map((artifact) => (
                    <ArtifactCard key={artifact.id} artifact={artifact} />
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Activity Feed</h3>
              <ActivityFeed items={state.activities} />
            </div>
          </div>

          {/* Right — Team */}
          <div className="col-span-4">
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Team</h3>
            <AIEmployeeGrid employees={state.employees} />
          </div>
        </div>
      </div>
    </div>
  );
}
