'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { AGENT_PERSONALITY } from '../constants/agent-personality.constants';
import type { AgentRole } from '@/ai/agents/core/agent.types';

const SEQUENCE: { role: AgentRole; label: string }[] = [
  { role: 'CEO', label: 'Understanding your idea' },
  { role: 'CEO', label: 'Writing product requirements' },
  { role: 'ARCHITECT', label: 'Designing the architecture' },
];

export function TeamAssembling({ onDone }: { onDone: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= SEQUENCE.length) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setActiveIndex((i) => i + 1), 1400);
    return () => clearTimeout(t);
  }, [activeIndex, onDone]);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <p className="text-center text-sm text-muted-foreground">Your AI team is getting started…</p>
      <div className="space-y-2">
        {SEQUENCE.map((step, i) => {
          const persona = AGENT_PERSONALITY[step.role];
          const Icon = persona.icon;
          const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';

          return (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: persona.bg, color: persona.color }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className={`flex-1 text-sm ${state === 'pending' ? 'text-muted-foreground' : ''}`}>{step.label}</span>
              {state === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              {state === 'active' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {state === 'pending' && <Circle className="h-4 w-4 text-muted-foreground/40" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
