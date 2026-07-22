'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

interface Step {
  label: string;
  icon?: React.ReactNode;
}

interface ThinkingStepsProps {
  steps: Step[];
  onDone?: () => void;
  intervalMs?: number;
}

export function ThinkingSteps({ steps, onDone, intervalMs = 1200 }: ThinkingStepsProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= steps.length) {
      if (onDone) {
        const t = setTimeout(onDone, 400);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(() => setActiveIndex((i) => i + 1), intervalMs);
    return () => clearTimeout(t);
  }, [activeIndex, steps.length, intervalMs, onDone]);

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'pending';
        return (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              {step.icon ?? <span className="text-xs font-medium">{i + 1}</span>}
            </span>
            <span className={`flex-1 text-sm ${state === 'pending' ? 'text-muted-foreground' : ''}`}>
              {step.label}
            </span>
            {state === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
            {state === 'active' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {state === 'pending' && <Circle className="h-4 w-4 text-muted-foreground/40" />}
          </div>
        );
      })}
    </div>
  );
}
