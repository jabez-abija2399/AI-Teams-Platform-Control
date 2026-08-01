"use client";

import { AIEmployeeGrid } from "../company/ai-employee-card";
import { ActivityFeed } from "../company/activity-feed";
import { ArtifactCard } from "../company/artifact-card";
import { ApprovalDialog } from "../company/approval-dialog";
import { QualityScore } from "../company/quality-score";
import { RoomHeader } from "../company/room-header";
import { usePipelineContext } from "../../hooks/use-pipeline";

export function ReviewRoom({ projectId }: { projectId: string }) {
  const { state, approve } = usePipelineContext();
  const isApproval = state.phaseStatus === "approval";
  const isComplete = state.phaseStatus === "completed";

  return (
    <div className="flex h-full flex-col">
      <RoomHeader
        phaseNumber={9}
        totalPhases={12}
        title="Review Committee Room"
        subtitle={
          isApproval
            ? "Review approval required to proceed"
            : isComplete
              ? "Review complete"
              : "AI Review Board is evaluating the codebase"
        }
        status={isComplete ? "completed" : isApproval ? "approval" : "running"}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-white">Review Committee</h2>
            <p className="mt-1 text-xs text-zinc-400">Expert reviewers evaluating your product</p>
          </div>

          <QualityScore
            score={state.healthScore}
            label="Review Score"
            details={[
              { label: "Architecture reviewed", passed: state.progress > 30 },
              { label: "Code quality passed", passed: state.progress > 50 },
              { label: "Security audit passed", passed: state.progress > 70 },
              { label: "Performance benchmark passed", passed: state.progress > 90 },
            ]}
          />

          {state.artifacts.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Review Reports</h3>
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
                onApprove={() => approve(req.artifactName || "REVIEW_APPROVAL")}
                onRequestChanges={() => {}}
                onReject={() => {}}
              />
            );
          })()}

          <div>
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Review Activity</h3>
            <ActivityFeed items={state.activities} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h4 className="text-xs font-medium text-white mb-2">AI Team Status</h4>
              <AIEmployeeGrid employees={state.employees} />
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h4 className="text-xs font-medium text-white mb-2">Pipeline Progress</h4>
              <div className="space-y-1">
                {state.phases.filter(p => p.id !== "completed").slice(0, 6).map((phase) => (
                  <div key={phase.id} className="flex items-center gap-2 text-[10px]">
                    <span className={phase.status === "completed" ? "text-emerald-400" : phase.status === "active" ? "text-sky-400" : "text-zinc-600"}>
                      {phase.status === "completed" ? "✓" : phase.status === "active" ? "●" : "○"}
                    </span>
                    <span className={phase.status === "completed" ? "text-zinc-400" : phase.status === "active" ? "text-white" : "text-zinc-600"}>
                      {phase.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
