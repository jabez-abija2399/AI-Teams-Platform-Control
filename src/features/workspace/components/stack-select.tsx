'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  STACK_OPTIONS,
  type ProjectStackId,
} from '@/core/project-stack/stack-catalog';
import { Sparkles, Zap, Code2, Globe } from 'lucide-react';

interface StackSelectProps {
  value: ProjectStackId | null;
  onChange: (stack: ProjectStackId) => void;
  /** Compact for Mission Control / modals */
  compact?: boolean;
  disabled?: boolean;
  className?: string;
  /** Highlight detection suggestion (Preview change only) */
  suggestedId?: ProjectStackId | null;
}

// Map stack IDs to distinctive iconography
const STACK_ICONS: Record<string, React.ReactNode> = {
  'static-html': <Globe className="w-4 h-4 text-emerald-400" />,
  'react': <Code2 className="w-4 h-4 text-cyan-400" />,
  'nextjs': <Zap className="w-4 h-4 text-indigo-400" />,
};

/**
 * Ultra-modern Cyber Void stack picker for Project Creation and Workspace settings.
 * Employs frosted glass surfaces, neon border highlights, and micro-interactions.
 */
export function StackSelect({
  value,
  onChange,
  compact = false,
  disabled = false,
  className,
  suggestedId,
}: StackSelectProps) {
  return (
    <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3', className)}>
      {STACK_OPTIONS.map((opt) => {
        const selected = value === opt.id;
        const icon = STACK_ICONS[opt.id] || <Sparkles className="w-4 h-4 text-primary" />;

        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              'group relative flex flex-col text-left rounded-2xl border transition-all duration-300 backdrop-blur-xl overflow-hidden',
              compact ? 'p-3' : 'p-4',
              selected
                ? 'border-primary/80 bg-primary/10 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-primary/60'
                : 'border-white/10 bg-surface-glass/40 hover:border-white/25 hover:bg-surface-glass/70',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Top row: Icon, Label, and Badges */}
            <div className="flex items-center justify-between gap-2 w-full mb-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center border transition-colors',
                  selected ? 'border-primary/40 bg-primary/20' : 'border-white/10 bg-white/5 group-hover:border-white/20'
                )}>
                  {icon}
                </div>
                <span className={cn('font-bold tracking-tight', selected ? 'text-white' : 'text-white/80 group-hover:text-white', compact ? 'text-xs' : 'text-sm')}>
                  {opt.shortLabel || opt.label}
                </span>
              </div>

              {/* Status / Recommended Tags */}
              <div className="flex items-center gap-1.5">
                {opt.isDefault && (
                  <span className="rounded-full bg-success/20 text-success border border-success/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm">
                    Default
                  </span>
                )}
                {opt.recommended && (
                  <span className="rounded-full bg-gradient-to-r from-primary to-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                    Recommended
                  </span>
                )}
                {suggestedId === opt.id && !opt.recommended && (
                  <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-white/70">
                    Detected
                  </span>
                )}
              </div>
            </div>

            {/* Plain language explanation */}
            <p className={cn('text-white/60 leading-relaxed', compact ? 'text-[11px]' : 'text-xs')}>
              {opt.plainLanguage}
            </p>

            {/* Expanded technical details for standard form mode */}
            {!compact && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
                <span>Speed: <strong className="text-white/70">{opt.speed}</strong></span>
                <span className="text-[9px] uppercase tracking-wider text-primary/80">
                  {selected ? '● Selected' : 'Select'}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
