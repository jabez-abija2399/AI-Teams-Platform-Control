"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RoomRouter, type PipelinePhaseId } from "./rooms/room-router";
import { PhaseNav } from "./phase-nav";
import { PipelineProvider, usePipelineContext } from "../components/pipeline-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";

interface CompanyWorkspaceProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  userName: string;
}

function CompanyWorkspaceInner({
  projectId,
  projectName,
  projectDescription,
  userName,
}: CompanyWorkspaceProps) {
  const { state, loading, error, refresh } = usePipelineContext();
  const [userSelectedPhase, setUserSelectedPhase] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Let pipeline state drive the room, unless user manually clicked a tab
  const activePhase = (userSelectedPhase || state.currentPhase) as PipelinePhaseId;
  const isWaiting = state.phaseStatus === "waiting" && state.progress === 0;

  // Auto-clear user selection when pipeline advances
  useEffect(() => {
    if (userSelectedPhase && userSelectedPhase !== state.currentPhase) {
      const phaseOrder = ["discovery", "clarification", "proposal", "strategy", "product", "architecture", "planning", "development", "review", "deployment", "completed"];
      const selectedIdx = phaseOrder.indexOf(userSelectedPhase);
      const currentIdx = phaseOrder.indexOf(state.currentPhase);
      if (selectedIdx <= currentIdx) {
        setUserSelectedPhase(null);
      }
    }
  }, [state.currentPhase, userSelectedPhase]);

  const handleStartPipeline = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/lifecycle/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIdea: projectDescription }),
      });
      if (res.ok) {
        setTimeout(refresh, 1000);
      }
    } catch (err) {
      console.error("Failed to start pipeline:", err);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <span className="text-xs text-zinc-500">Connecting to AI pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#09090b]">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <div className="flex items-center gap-3">
          <a href="/dashboard/projects" className="text-zinc-500 hover:text-white transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-xs">
              🏢
            </div>
            <span className="text-xs font-medium text-white">{projectName}</span>
          </div>
          <span className="rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-400">
            AI Multi-Agent Sync
          </span>
          {error && (
            <span className="rounded-md bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-400">
              Reconnecting...
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">{userName}</span>
          </div>
        </div>
      </div>

      {/* Phase Navigation */}
      <PhaseNav
        currentPhase={activePhase}
        onPhaseChange={(phase) => setUserSelectedPhase(phase)}
      />

      {/* Main Content — Room */}
      <div className="flex-1 overflow-hidden">
        {isWaiting ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05] text-3xl mb-4">🏢</div>
            <h2 className="text-lg font-bold text-white mb-2">Ready to Build</h2>
            <p className="text-sm text-zinc-400 mb-6 max-w-md text-center">
              Your AI company is assembled and waiting to start building <span className="text-white font-medium">{projectName}</span>.
            </p>
            <Button
              onClick={handleStartPipeline}
              disabled={starting}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold px-8 py-3 text-sm"
            >
              {starting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" /> Starting Pipeline...
                </span>
              ) : (
                "🚀 Start AI Pipeline"
              )}
            </Button>
          </div>
        ) : (
          <RoomRouter
            phase={activePhase}
            projectId={projectId}
            projectName={projectName}
            projectDescription={projectDescription}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-1.5">
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-zinc-600">
            Phase {state.phases.findIndex(p => p.id === activePhase) + 1}/{state.phases.length || 11}
          </span>
          <span className="text-[10px] text-zinc-600">|</span>
          <span className="text-[10px] text-zinc-600">
            {state.employees.filter(e => e.status === "active").length} active agents
          </span>
          <span className="text-[10px] text-zinc-600">|</span>
          <span className="text-[10px] text-zinc-600">
            Progress: {state.progress}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-1.5 w-1.5 rounded-full",
            state.phaseStatus === "running" ? "bg-emerald-500 animate-pulse" : "bg-emerald-500"
          )} />
          <span className="text-[10px] text-zinc-600">All systems operational</span>
        </div>
      </div>
    </div>
  );
}

export function CompanyWorkspace(props: CompanyWorkspaceProps) {
  return (
    <PipelineProvider projectId={props.projectId}>
      <CompanyWorkspaceInner {...props} />
    </PipelineProvider>
  );
}
