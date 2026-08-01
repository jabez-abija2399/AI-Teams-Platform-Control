'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '../stores/workspace.store';
import { Bot, Lightbulb, Code2, Bug, Activity, Rocket, Sparkles, Shield, Cpu } from 'lucide-react';

const MissionControlDashboard = dynamic(
  () => import('@/features/observability/components/mission-control-dashboard').then((m) => ({ default: m.MissionControlDashboard })),
  { ssr: false },
);

const DeploymentPanel = dynamic(
  () => import('@/features/deployment/components/deployment-panel').then((m) => ({ default: m.DeploymentPanel })),
  { ssr: false },
);

const CEOChat = dynamic(
  () => import('@/features/ceo-ai/components/ceo-chat').then((m) => ({ default: m.CEOChat })),
  { ssr: false },
);

const ArchitectureChat = dynamic(
  () => import('@/features/architect-ai/components/architecture-chat').then((m) => ({ default: m.ArchitectureChat })),
  { ssr: false },
);

const DeveloperChat = dynamic(
  () => import('@/features/developer-ai/components/developer-chat').then((m) => ({ default: m.DeveloperChat })),
  { ssr: false },
);

const QAChat = dynamic(
  () => import('@/features/qa-ai/components/qa-chat').then((m) => ({ default: m.QAChat })),
  { ssr: false },
);

interface AgentTab {
  id: string;
  label: string;
  icon: typeof Bot;
}

const AGENT_TABS: AgentTab[] = [
  { id: 'mission-control', label: 'Mission Control', icon: Activity },
  { id: 'ceo', label: 'CEO Agent', icon: Lightbulb },
  { id: 'architect', label: 'Architect', icon: Bot },
  { id: 'developer', label: 'Developer', icon: Code2 },
  { id: 'qa', label: 'QA Tester', icon: Bug },
  { id: 'deploy', label: 'Deploy Engine', icon: Rocket },
];

interface AgentPanelProps {
  projectId: string;
}

export function AgentPanel({ projectId }: AgentPanelProps) {
  const activeTab = useWorkspaceStore((s) => s.activeAgentTab);
  const setActiveAgentTab = useWorkspaceStore((s) => s.setActiveAgentTab);

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const markCompleted = useCallback((step: string) => {
    setCompletedSteps((prev) => {
      if (prev.has(step)) return prev;
      const next = new Set(prev);
      next.add(step);
      return next;
    });
  }, []);

  const handleCeoComplete = useCallback(() => {
    markCompleted('ceo');
  }, [markCompleted]);

  const handleArchitectComplete = useCallback(() => {
    markCompleted('architect');
  }, [markCompleted]);

  const handleDeveloperComplete = useCallback(() => {
    markCompleted('developer');
  }, [markCompleted]);

  const ActiveComponent = useMemo(() => {
    switch (activeTab) {
      case 'mission-control':
        return <MissionControlDashboard projectId={projectId} />;
      case 'ceo':
        return (
          <CEOChat
            projectId={projectId}
            onComplete={handleCeoComplete}
          />
        );
      case 'architect':
        return (
          <ArchitectureChat
            projectId={projectId}
            onComplete={handleArchitectComplete}
          />
        );
      case 'developer':
        return (
          <DeveloperChat
            projectId={projectId}
            onComplete={handleDeveloperComplete}
          />
        );
      case 'qa':
        return (
          <QAChat projectId={projectId} />
        );
      case 'deploy':
        return (
          <DeploymentPanel projectId={projectId} />
        );
      default:
        return <MissionControlDashboard projectId={projectId} />;
    }
  }, [activeTab, projectId, handleCeoComplete, handleArchitectComplete, handleDeveloperComplete]);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-gray-950 via-slate-950/90 to-gray-950 text-white">
      {/* Top AI Command Center Banner */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-500/30 flex items-center justify-center shadow-lg">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
              Autonomous AI Workforce Pipeline
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-[10px] text-gray-400">Sequential Chain: CEO &rarr; Architect &rarr; Developer &rarr; QA &rarr; Deploy</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-gray-300">
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Agentic Mode: <strong className="text-white">Autonomous</strong></span>
          </div>
        </div>
      </div>

      {/* Modern Floating Pill Tabs */}
      <div className="p-2.5 border-b border-white/10 bg-gray-900/40 backdrop-blur-md">
        <div className="flex items-center justify-between gap-1 bg-gray-950/80 p-1.5 rounded-xl border border-white/10 overflow-x-auto custom-scrollbar">
          {AGENT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDone = completedSteps.has(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAgentTab(tab.id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 whitespace-nowrap',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02] border border-white/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5 shrink-0 transition-transform', isActive && 'scale-110 text-amber-300', isDone && !isActive && 'text-emerald-400')} />
                <span>{tab.label}</span>
                {isDone && (
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-bold">
                    &#10003;
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Agent Execution Viewport */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-gradient-to-b from-transparent to-black/30">
        {ActiveComponent}
      </div>

      {/* Live Telemetry Footer Bar */}
      <div className="px-4 py-2 border-t border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between text-[10px] font-mono text-gray-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            AI Router Active
          </span>
          <span className="hidden md:inline text-gray-500">|</span>
          <span className="hidden md:inline">Models: <strong className="text-indigo-300">Gemini 2.5 Flash &bull; Claude 3.7 Sonnet</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5 text-gray-300 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-indigo-400" />
            Latency: 42ms
          </span>
          <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-bold">
            0 Errors
          </span>
        </div>
      </div>
    </div>
  );
}
