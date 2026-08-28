'use client';

// Import Next.js routing Link.
import Link from 'next/link';
// Import Lucide icons for empty state aesthetics.
import { Plus, Sparkles, Bot, Layers, Code2 } from 'lucide-react';
// Import our centralized Atomic UI components.
import { GlassCard, NeonButton } from '@/packages/ui';
// Import routing constants.
import { ROUTES } from '@/config/constants';

/**
 * Ultra-Modern Empty State Prompt for Projects Hub.
 * Features frosted glass surfaces, glowing AI company badges, and quick project launch action.
 */
export function EmptyProjectPrompt() {
  return (
    <GlassCard className="mx-auto flex w-full max-w-xl flex-col items-center p-10 text-center border-primary/20 bg-gradient-to-b from-surface-glass/80 to-primary/5 shadow-2xl relative overflow-hidden">
      {/* Background neon blur accent */}
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      
      {/* Glowing AI Company Icon */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/40 shadow-[0_0_25px_rgba(99,102,241,0.4)]">
        <Sparkles className="h-8 w-8" />
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
        Launch Your First AI Project
      </h2>
      
      <p className="max-w-md text-sm leading-relaxed text-white/60 mb-6">
        Describe your software idea. Your autonomous 5-agent engineering team handles architecture, design, code generation, and verification in real time.
      </p>

      {/* Feature pillars */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm mb-8">
        <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <Bot className="w-4 h-4 text-primary mb-1" />
          <span className="text-[10px] font-mono uppercase text-white/60">5 AI Agents</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <Layers className="w-4 h-4 text-cyan-400 mb-1" />
          <span className="text-[10px] font-mono uppercase text-white/60">Full Arch</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <Code2 className="w-4 h-4 text-emerald-400 mb-1" />
          <span className="text-[10px] font-mono uppercase text-white/60">Live Code</span>
        </div>
      </div>

      {/* Launch Action */}
      <Link href={`${ROUTES.projects}/new`} className="w-full sm:w-auto">
        <NeonButton variant="primary" className="w-full sm:w-auto px-8 h-12 text-sm font-bold shadow-xl">
          <Plus className="h-4 w-4 mr-1.5" />
          Initialize New Project
        </NeonButton>
      </Link>
    </GlassCard>
  );
}

export default function EmptyProjectsFallback() {
  return (
    <div className="py-12">
      <EmptyProjectPrompt />
    </div>
  );
}
