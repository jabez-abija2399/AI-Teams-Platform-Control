'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentAvatar } from '@/features/onboarding/components/agent-avatar';
import { fetchAgentSummaries } from '@/app/dashboard/ai-teams/actions';
import type { AgentSummaryData } from '@/app/dashboard/ai-teams/actions';
import { cn } from '@/lib/utils';

export function AgentOverview() {
  const [agents, setAgents] = useState<AgentSummaryData[]>([]);

  useEffect(() => {
    fetchAgentSummaries().then(setAgents).catch(() => {});
  }, []);

  const statusColor: Record<string, string> = {
    IDLE: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    WORKING: 'bg-primary/15 text-primary border border-primary/30 animate-pulse',
    BLOCKED: 'bg-destructive/15 text-destructive border border-destructive/30',
    OFFLINE: 'bg-muted text-muted-foreground border border-transparent',
    ERROR: 'bg-destructive/15 text-destructive border border-destructive/30',
    PAUSED: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
  };

  return (
    <Card className="rounded-2xl border border-border/80 glass-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-foreground">AI Employees & Roles</CardTitle>
          <span className="text-xs font-semibold text-primary">5 Active Agents</span>
        </div>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No agents active. Start a workflow to spawn agents.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-center justify-between rounded-xl border border-border/70 glass-card p-3.5 transition-all duration-200 hover:border-primary/30 hover:shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AgentAvatar role={agent.role as 'CEO' | 'ARCHITECT' | 'DEVELOPER' | 'QA'} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-foreground">{agent.name}</p>
                    <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    statusColor[agent.status] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  {agent.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
