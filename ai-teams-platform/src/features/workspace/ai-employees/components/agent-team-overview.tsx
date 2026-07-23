'use client';

import { Bot, Lightbulb, Code2, Bug, Rocket, Shield, BookOpen, Monitor, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '../../stores/workspace.store';

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  icon: typeof Bot;
  color: string;
}

const AGENTS: AgentInfo[] = [
  { id: 'ceo', name: 'CEO', role: 'Strategy & Planning', icon: Lightbulb, color: 'text-amber-500' },
  { id: 'architect', name: 'Architect', role: 'System Design', icon: Bot, color: 'text-blue-500' },
  { id: 'developer', name: 'Developer', role: 'Code Generation', icon: Code2, color: 'text-emerald-500' },
  { id: 'qa', name: 'QA', role: 'Testing & Quality', icon: Bug, color: 'text-purple-500' },
  { id: 'devops', name: 'DevOps', role: 'CI/CD & Deploy', icon: Rocket, color: 'text-red-500' },
  { id: 'security', name: 'Security', role: 'Vulnerability Scan', icon: Shield, color: 'text-cyan-500' },
  { id: 'documentation', name: 'Docs', role: 'Documentation', icon: BookOpen, color: 'text-indigo-500' },
  { id: 'ui-ux', name: 'UI/UX', role: 'Design System', icon: Monitor, color: 'text-pink-500' },
];

export function AgentTeamOverview({ projectId: _projectId }: { projectId: string }) {
  const setActiveAgentTab = useWorkspaceStore((s) => s.setActiveAgentTab);

  function handleAgentClick(agentId: string) {
    if (['ceo', 'architect', 'developer', 'qa'].includes(agentId)) {
      setActiveAgentTab(agentId);
    }
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        Your AI Team
      </div>
      <div className="grid grid-cols-2 gap-2">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          const isClickable = ['ceo', 'architect', 'developer', 'qa'].includes(agent.id);
          return (
            <button
              key={agent.id}
              onClick={() => isClickable && handleAgentClick(agent.id)}
              disabled={!isClickable}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors',
                isClickable
                  ? 'hover:bg-secondary/60 hover:border-ring/50 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed',
              )}
            >
              <Icon className={cn('h-6 w-6', agent.color)} />
              <span className="text-xs font-medium">{agent.name}</span>
              <span className="text-[10px] leading-tight text-muted-foreground">{agent.role}</span>
              <span className={cn(
                'mt-1 rounded-full px-2 py-0.5 text-[9px] font-medium',
                isClickable
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-muted text-muted-foreground',
              )}>
                {isClickable ? 'Active' : 'Coming Soon'}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Click an active agent to open their panel on the right. Describe your idea to CEO AI to start building.
      </p>
    </div>
  );
}
