'use client';

import { useEffect, useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TourStep {
  target: string;
  title: string;
  content: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="ai-panel"]',
    title: 'AI Team Panel',
    content: 'Chat with your AI agents here. They can write code, design architecture, and test your app.',
  },
  {
    target: '[data-tour="editor"]',
    title: 'Code Editor',
    content: 'Your code lives here. AI agents will create and edit files as they build your project.',
  },
  {
    target: '[data-tour="terminal"]',
    title: 'Terminal & Output',
    content: 'See build logs, test results, and terminal output from your project.',
  },
];

function getRect(target: string): DOMRect | null {
  if (typeof document === 'undefined') return null;
  const el = document.querySelector(target);
  return el ? el.getBoundingClientRect() : null;
}

interface SpotlightTourProps {
  onComplete: () => void;
}

export function SpotlightTour({ onComplete }: SpotlightTourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(() => getRect(TOUR_STEPS[0]?.target ?? ''));

  useEffect(() => {
    const current = TOUR_STEPS[step];
    if (!current) return;
    const update = () => setRect(getRect(current.target));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [step]);

  const current = TOUR_STEPS[step];
  if (!current || !rect) return null;

  const GAP = 12;
  const tooltipTop = rect.bottom + GAP;
  const tooltipLeft = Math.min(rect.left, window.innerWidth - 320);

  function handleNext() {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onComplete} />
      <div
        className="absolute rounded-lg ring-2 ring-blue-500 ring-offset-2"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          background: 'transparent',
        }}
      />
      <div
        className="absolute w-72 rounded-lg border bg-card p-4 shadow-xl"
        style={{ top: tooltipTop, left: tooltipLeft }}
      >
        <div className="mb-1 flex items-center justify-between">
          <h4 className="text-sm font-medium">{current.title}</h4>
          <button onClick={onComplete} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-muted-foreground text-xs">{current.content}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-muted-foreground text-xs">
            {step + 1} of {TOUR_STEPS.length}
          </span>
          <Button size="sm" onClick={handleNext}>
            {step < TOUR_STEPS.length - 1 ? (
              <>Next <ChevronRight className="ml-1 h-3 w-3" /></>
            ) : (
              'Get Started'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
