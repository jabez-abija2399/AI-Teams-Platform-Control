'use client';

import React from 'react';
import { Brain, Layers, Sparkles, Terminal, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const AGENTS = [
  { id: 'ceo', label: 'CEO', icon: Brain, output: 'Product Spec', status: 'done' as const },
  { id: 'architect', label: 'ARCHITECT', icon: Layers, output: 'Architecture Spec', status: 'done' as const },
  { id: 'designer', label: 'DESIGNER', icon: Sparkles, output: 'Design Spec', status: 'active' as const },
  { id: 'developer', label: 'DEVELOPER', icon: Terminal, output: 'Implementation', status: 'pending' as const },
] as const;

type AgentStatus = 'done' | 'active' | 'pending';

const STATUS_CONFIG: Record<AgentStatus, {
  card: string;
  label: string;
  labelClass: string;
  icon: React.FC<{ className?: string }>;
}> = {
  done: {
    card: 'border-outline-variant/60 bg-surface-container-low opacity-70 hover:opacity-100 transition-opacity',
    label: 'DONE',
    labelClass: 'text-on-surface-variant',
    icon: ({ className }) => <CheckCircle2 className={className} />,
  },
  active: {
    card: 'border-primary/40 bg-primary/5',
    label: 'WORKING',
    labelClass: 'text-primary font-bold',
    icon: ({ className }) => <Loader2 className={cn(className, 'animate-spin')} />,
  },
  pending: {
    card: 'border-outline-variant/40 bg-surface-container-low opacity-40 hover:opacity-70 transition-opacity',
    label: 'WAITING',
    labelClass: 'text-on-surface-variant/60',
    icon: ({ className }) => <Clock className={className} />,
  },
};

export function AgentRosterGrid() {
  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
        AI Workforce
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {AGENTS.map((agent) => {
          const cfg = STATUS_CONFIG[agent.status];
          const AgentIcon = agent.icon;
          const StatusIcon = cfg.icon;

          return (
            <div
              key={agent.id}
              className={cn(
                'border p-4 rounded-sm flex flex-col gap-2.5',
                cfg.card,
              )}
            >
              <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2">
                <div className="flex items-center gap-1.5">
                  <AgentIcon
                    className={cn(
                      'w-3.5 h-3.5',
                      agent.status === 'active' ? 'text-primary' : 'text-on-surface-variant',
                    )}
                  />
                  <span className="font-mono text-[10px] font-bold text-on-surface uppercase">
                    {agent.label}
                  </span>
                </div>
                <StatusIcon
                  className={cn(
                    'w-3.5 h-3.5',
                    agent.status === 'active' ? 'text-primary' : 'text-on-surface-variant',
                  )}
                />
              </div>

              <p className="font-mono text-[11px] text-on-surface-variant">{agent.output}</p>

              <div className="mt-auto pt-2 border-t border-outline-variant/40 flex justify-between items-center font-mono text-[10px]">
                <span className="text-on-surface-variant uppercase tracking-wider">Status</span>
                <span className={cn('font-bold uppercase', cfg.labelClass)}>{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
