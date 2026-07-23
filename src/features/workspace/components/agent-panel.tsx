'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '../stores/workspace.store';
import { Bot, Lightbulb, Code2, Bug } from 'lucide-react';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';

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
  { id: 'ceo', label: 'CEO', icon: Lightbulb },
  { id: 'architect', label: 'Architect', icon: Bot },
  { id: 'developer', label: 'Developer', icon: Code2 },
  { id: 'qa', label: 'QA', icon: Bug },
];

const NEXT_TAB: Record<string, string> = {
  ceo: 'architect',
  architect: 'developer',
  developer: 'qa',
};

interface AgentPanelProps {
  projectId: string;
}

export function AgentPanel({ projectId }: AgentPanelProps) {
  const activeTab = useWorkspaceStore((s) => s.activeAgentTab);
  const setActiveAgentTab = useWorkspaceStore((s) => s.setActiveAgentTab);

  const [ceoOutput, setCeoOutput] = useState<CEOAnalysis | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Track which steps were auto-advanced (prevents re-advancing on re-mount/status poll)
  const autoAdvanced = useRef<Set<string>>(new Set());

  const markCompleted = useCallback((step: string) => {
    setCompletedSteps((prev) => {
      if (prev.has(step)) return prev;
      const next = new Set(prev);
      next.add(step);
      return next;
    });
  }, []);

  // Auto-advance to next tab when a step completes, but only once per step
  useEffect(() => {
    for (const [step, next] of Object.entries(NEXT_TAB)) {
      if (completedSteps.has(step) && !autoAdvanced.current.has(step)) {
        autoAdvanced.current.add(step);
        setActiveAgentTab(next);
        break;
      }
    }
  }, [completedSteps, setActiveAgentTab]);

  const handleCeoComplete = useCallback((data: CEOAnalysis) => {
    setCeoOutput(data);
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
            defaultRequirements={ceoOutput?.requirements}
            onComplete={handleArchitectComplete}
            autoRun={completedSteps.has('ceo')}
          />
        );
      case 'developer':
        return (
          <DeveloperChat
            projectId={projectId}
            onComplete={handleDeveloperComplete}
            autoRun={completedSteps.has('architect')}
          />
        );
      case 'qa':
        return (
          <QAChat projectId={projectId} />
        );
      default:
        return <CEOChat projectId={projectId} onComplete={handleCeoComplete} />;
    }
  }, [activeTab, projectId, ceoOutput, completedSteps, handleCeoComplete, handleArchitectComplete, handleDeveloperComplete]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b">
        {AGENT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isDone = completedSteps.has(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAgentTab(tab.id)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 border-b-2 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5 shrink-0', isDone && 'text-green-500')} />
              {tab.label}
              {isDone && <span className="text-[10px] text-green-500">&#10003;</span>}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto">
        {ActiveComponent}
      </div>
    </div>
  );
}
