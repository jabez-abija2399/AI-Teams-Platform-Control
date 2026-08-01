"use client";

import { useMemo } from "react";
import { AIEmployeeGrid } from "../company/ai-employee-card";
import { ActivityFeed } from "../company/activity-feed";
import { ApprovalDialog } from "../company/approval-dialog";
import { RoomHeader } from "../company/room-header";
import { ThinkingPanel } from "../company/thinking-panel";
import { AnalysisSteps } from "../company/analysis-steps";
import { usePipelineContext } from "../../hooks/use-pipeline";

interface DiscoveryRoomProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
}

const THINKING_STEPS = [
  {
    label: "Market Research",
    content: "Analyzing market trends, competitor landscape, and growth opportunities for your business idea.",
    keywords: ["market", "competitor", "trend", "research"],
  },
  {
    label: "Business Model Analysis",
    content: "Evaluating revenue streams, cost structure, and value proposition to ensure business viability.",
    keywords: ["revenue", "cost", "value", "model"],
  },
  {
    label: "User Persona Development",
    content: "Identifying target users, their pain points, behaviors, and needs to shape the product direction.",
    keywords: ["user", "persona", "pain", "behavior"],
  },
  {
    label: "Technical Feasibility",
    content: "Assessing technology requirements, integration needs, and implementation complexity.",
    keywords: ["technical", "feasibility", "architecture"],
  },
  {
    label: "Risk Assessment",
    content: "Evaluating potential risks, mitigation strategies, and success factors for your project.",
    keywords: ["risk", "assessment", "mitigation"],
  },
  {
    label: "Product Specification",
    content: "Compiling all findings into a comprehensive product specification document.",
    keywords: ["specification", "document", "compile"],
  },
];

function getStepStates(progress: number, activities: { action: string }[]) {
  const activeText = activities.map((a) => a.action.toLowerCase()).join(" ");
  const stepCount = THINKING_STEPS.length;
  const completedSteps = Math.floor((progress / 100) * stepCount);
  const activeIdx = Math.min(completedSteps, stepCount - 1);

  return THINKING_STEPS.map((step, i) => {
    let status: "completed" | "active" | "pending" = "pending";
    if (i < completedSteps) {
      status = "completed";
    } else if (i === activeIdx && progress > 0) {
      status = "active";
    }
    return {
      ...step,
      status,
      content: step.content,
    };
  });
}

export function DiscoveryRoom({
  projectId,
  projectName,
  projectDescription,
}: DiscoveryRoomProps) {
  const { state, approve } = usePipelineContext();
  const isComplete = state.phaseStatus === "completed";
  const isApproval = state.phaseStatus === "approval";
  const isActive = state.phaseStatus === "running";

  const thinkingSteps = useMemo(
    () => getStepStates(state.progress, state.activities),
    [state.progress, state.activities]
  );

  const analysisSteps = useMemo(
    () =>
      THINKING_STEPS.map((step, i) => ({
        id: step.label.toLowerCase().replace(/\s+/g, "_"),
        label: step.label,
        icon: ["🔍", "💰", "👤", "⚙️", "⚠️", "📄"][i]!,
        status: (i < Math.floor((state.progress / 100) * THINKING_STEPS.length)
          ? "completed"
          : i === Math.floor((state.progress / 100) * THINKING_STEPS.length) && state.progress > 0
            ? "active"
            : "pending") as "completed" | "active" | "pending",
        detail: step.keywords.join(", "),
      })),
    [state.progress]
  );

  return (
    <div className="flex h-full flex-col">
      <RoomHeader
        phaseNumber={1}
        totalPhases={12}
        title="Discovery Room"
        subtitle={
          isComplete
            ? "CEO completed the analysis"
            : isApproval
              ? "CEO needs your approval to proceed"
              : "CEO is analyzing your business idea"
        }
        status={isComplete ? "completed" : isApproval ? "approval" : "running"}
      />

      <div className="flex-1 overflow-auto">
        <div className="grid h-full grid-cols-12 gap-0">
          {/* Left — Project Vision + Analysis Steps */}
          <div className="col-span-3 border-r border-white/[0.06] p-4 space-y-4">
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Project Vision</h3>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <h4 className="text-sm font-semibold text-white">{projectName}</h4>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{projectDescription}</p>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Analysis Steps</h3>
              <AnalysisSteps steps={analysisSteps} overallProgress={state.progress} />
            </div>
          </div>

          {/* Center — Thinking Panel */}
          <div className="col-span-6 flex flex-col p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05] text-sm">👔</div>
              <div>
                <span className="text-xs font-medium text-white">CEO AI</span>
                <span className="ml-2 text-[10px] text-zinc-500">
                  {isComplete ? "Analysis Complete" : isActive ? "Analyzing Business Opportunity" : "Waiting to start..."}
                </span>
              </div>
            </div>

            <ThinkingPanel
              steps={thinkingSteps}
              isActive={isActive}
            />

            {/* Approval */}
            {isApproval && state.approvalRequests[0] && (() => {
              const req = state.approvalRequests[0]!;
              return (
                <div className="mt-4">
                  <ApprovalDialog
                    request={req}
                    onApprove={() => approve(req.artifactName || "PRODUCT_APPROVAL")}
                    onRequestChanges={() => {}}
                    onReject={() => {}}
                  />
                </div>
              );
            })()}

            {isComplete && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
                <p className="text-xs font-medium text-emerald-400">✓ Analysis Complete</p>
                <p className="mt-1 text-xs text-zinc-400">
                  The CEO has completed the business analysis and is ready for the next phase.
                </p>
              </div>
            )}
          </div>

          {/* Right — AI Team */}
          <div className="col-span-3 border-l border-white/[0.06] p-4">
            <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">AI Team</h3>
            <AIEmployeeGrid employees={state.employees} />
          </div>
        </div>

        {/* Bottom — Activity Feed */}
        <div className="border-t border-white/[0.06] p-4">
          <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Activity Feed</h3>
          <ActivityFeed items={state.activities} />
        </div>
      </div>
    </div>
  );
}
