"use client";

import { ActivityFeed } from "../company/activity-feed";
import { ArtifactCard } from "../company/artifact-card";
import { AIEmployeeGrid } from "../company/ai-employee-card";
import { RoomHeader } from "../company/room-header";
import { usePipelineContext } from "../../hooks/use-pipeline";

interface FinalRoomProps {
  projectId: string;
  projectName: string;
}

export function FinalRoom({ projectId, projectName }: FinalRoomProps) {
  const { state } = usePipelineContext();

  const completedPhases = state.phases.filter(p => p.status === "completed").length;
  const totalPhases = state.phases.filter(p => p.id !== "completed").length;

  const deliverables = state.artifacts.length > 0
    ? state.artifacts.map(a => ({
        icon: a.type === "ProjectIdea" || a.type === "ProductSpec" ? "📊" :
              a.type === "ArchitectureDesign" ? "🏗️" :
              a.type === "SourceCode" ? "💻" :
              a.type === "ReviewReport" || a.type === "QualityReport" ? "📝" :
              a.type === "SecurityReport" || a.type === "SecurityAudit" ? "🔒" :
              a.type === "DeploymentPlan" || a.type === "DeploymentConfig" ? "🚀" : "📄",
        title: a.name,
        description: a.type.replace(/([A-Z])/g, ' $1').trim(),
      }))
    : [
        { icon: "📊", title: "Product Specification", description: "Complete requirements and analysis" },
        { icon: "🏗️", title: "Architecture Design", description: "System architecture and tech stack" },
        { icon: "💻", title: "Source Code", description: "Full implementation" },
        { icon: "📝", title: "Review Reports", description: "Code review and quality reports" },
        { icon: "🔒", title: "Security Audit", description: "Security assessment" },
        { icon: "🚀", title: "Deployment Plan", description: "DevOps and deployment strategy" },
      ];

  return (
    <div className="flex h-full flex-col">
      <RoomHeader
        phaseNumber={12}
        totalPhases={12}
        title="Final Product Room"
        subtitle="Project complete — your software is ready"
        status="completed"
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/20 to-amber-500/10 text-4xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-foreground">Project Complete</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your AI software company has successfully built <span className="text-foreground font-medium">{projectName}</span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-border bg-white/[0.02] p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{completedPhases}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Phases Completed</p>
            </div>
            <div className="rounded-xl border border-border bg-white/[0.02] p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{state.healthScore}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Health Score</p>
            </div>
            <div className="rounded-xl border border-border bg-white/[0.02] p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{state.artifacts.length}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">Artifacts Generated</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white/[0.02] p-5 mb-6">
            <h3 className="text-xs font-semibold text-foreground mb-3">Deliverables</h3>
            <div className="grid grid-cols-2 gap-3">
              {deliverables.map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-lg border border-border bg-white/[0.01] p-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="ml-auto text-emerald-400 text-xs">✓</span>
                </div>
              ))}
            </div>
          </div>

          {state.artifacts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Generated Artifacts</h3>
              <div className="space-y-2">
                {state.artifacts.map((artifact) => (
                  <ArtifactCard key={artifact.id} artifact={artifact} />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">AI Team</h3>
              <AIEmployeeGrid employees={state.employees} />
            </div>
            <div>
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Project Activity</h3>
              <ActivityFeed items={state.activities.slice(0, 10)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
