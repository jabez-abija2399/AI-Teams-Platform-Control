'use client';

import { cn } from '@/lib/utils';
import type { PipelinePhaseId } from './rooms/room-router';
import {
  Search,
  MessageCircleQuestion,
  FileText,
  Target,
  ClipboardList,
  Building2,
  Calendar,
  Code2,
  CheckSquare,
  Rocket,
  PartyPopper,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface PhaseNavProps {
  currentPhase: PipelinePhaseId;
  onPhaseChange: (phase: PipelinePhaseId) => void;
}

const phases: {
  id: PipelinePhaseId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  { id: 'discovery', label: 'Discovery', shortLabel: 'Disc', icon: Search },
  { id: 'clarification', label: 'Clarification', shortLabel: 'Clar', icon: MessageCircleQuestion },
  { id: 'proposal', label: 'Proposal', shortLabel: 'Prop', icon: FileText },
  { id: 'strategy', label: 'Strategy', shortLabel: 'Strat', icon: Target },
  { id: 'product', label: 'Product', shortLabel: 'Prod', icon: ClipboardList },
  { id: 'architecture', label: 'Architecture', shortLabel: 'Arch', icon: Building2 },
  { id: 'planning', label: 'Planning', shortLabel: 'Plan', icon: Calendar },
  { id: 'development', label: 'Development', shortLabel: 'Dev', icon: Code2 },
  { id: 'review', label: 'Review', shortLabel: 'Rev', icon: CheckSquare },
  { id: 'deployment', label: 'Deployment', shortLabel: 'Deploy', icon: Rocket },
  { id: 'completed', label: 'Complete', shortLabel: 'Done', icon: PartyPopper },
];

export function PhaseNav({ currentPhase, onPhaseChange }: PhaseNavProps) {
  const currentIndex = phases.findIndex((p) => p.id === currentPhase);

  return (
    <div className="overflow-x-auto border-b border-border bg-card/80 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex min-w-max items-center gap-1">
        {phases.map((phase, index) => {
          const isActive = phase.id === currentPhase;
          const isPast = index < currentIndex;
          const Icon = phase.icon;

          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => onPhaseChange(phase.id)}
              className={cn(
                'group relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all',
                isActive && 'bg-primary text-primary-foreground shadow-sm',
                isPast && 'text-primary hover:bg-primary/10',
                !isActive && !isPast && 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{phase.label}</span>
              <span className="lg:hidden">{phase.shortLabel}</span>
              {isPast && !isActive && (
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
              {isActive && (
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-soft-pulse rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
