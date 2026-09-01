import { cn } from '@/lib/utils';
import { Check, Loader2, Clock } from 'lucide-react';

export type AgentPhaseStatus = 'done' | 'active' | 'pending';

export interface AgentPhase {
  id: string;
  label: string;
  status: AgentPhaseStatus;
}

interface AgentPipelineBarProps {
  phases: AgentPhase[];
  className?: string;
  compact?: boolean;
}

export function AgentPipelineBar({ phases, className, compact = false }: AgentPipelineBarProps) {
  return (
    <div className={cn('flex items-center gap-0', className)}>
      {phases.map((phase, i) => (
        <div key={phase.id} className="flex items-center">
          <div
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1',
              compact ? 'text-[10px]' : 'text-xs',
              'font-mono font-medium',
              phase.status === 'done' && 'text-on-surface-variant',
              phase.status === 'active' && 'text-primary font-bold',
              phase.status === 'pending' && 'text-on-surface-variant/40',
            )}
          >
            {phase.status === 'done' && <Check className="h-3 w-3 text-primary" />}
            {phase.status === 'active' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            {phase.status === 'pending' && <Clock className="h-3 w-3" />}
            <span className={cn(phase.status === 'done' && 'line-through')}>
              {phase.label}
            </span>
          </div>
          {i < phases.length - 1 && (
            <span className="text-outline-variant text-[10px] mx-0.5">›</span>
          )}
        </div>
      ))}
    </div>
  );
}
