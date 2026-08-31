'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Brain, Layers, Sparkles, Terminal, ArrowDown } from 'lucide-react';
import { ROUTES } from '@/config/constants';

export function EmptyWorkspaceView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
      <div className="max-w-xl flex flex-col items-center gap-6">
        <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
          Your first software project starts here.
        </h1>
        <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
          Describe what you want to build and HibirDev AI will guide it through product definition, architecture, design, and implementation.
        </p>

        <Link href={`${ROUTES.projects}/new`}>
          <button
            type="button"
            className="bg-primary text-black font-mono text-sm font-bold px-6 py-3.5 rounded flex items-center gap-2.5 hover:bg-primary-container transition-colors uppercase tracking-wider glow-cyan"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Project</span>
          </button>
        </Link>

        {/* Vertical Workflow Spine Visual */}
        <div className="mt-8 flex flex-col items-center gap-3 font-mono text-xs font-bold text-on-surface-variant">
          <div className="px-4 py-2 bg-surface border border-white/10 rounded uppercase">IDEA</div>
          <ArrowDown className="w-4 h-4 text-primary" />
          <div className="px-4 py-2 bg-surface border border-white/10 rounded flex items-center gap-2 uppercase">
            <Brain className="w-3.5 h-3.5" /> CEO
          </div>
          <ArrowDown className="w-4 h-4 text-primary" />
          <div className="px-4 py-2 bg-surface border border-white/10 rounded flex items-center gap-2 uppercase">
            <Layers className="w-3.5 h-3.5" /> ARCHITECT
          </div>
          <ArrowDown className="w-4 h-4 text-primary" />
          <div className="px-4 py-2 bg-surface border border-white/10 rounded flex items-center gap-2 uppercase">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> DESIGNER
          </div>
          <ArrowDown className="w-4 h-4 text-primary" />
          <div className="px-4 py-2 bg-surface border border-white/10 rounded flex items-center gap-2 uppercase">
            <Terminal className="w-3.5 h-3.5" /> DEVELOPER
          </div>
          <ArrowDown className="w-4 h-4 text-primary" />
          <div className="px-6 py-2.5 bg-primary/10 border border-primary text-primary rounded font-bold uppercase tracking-wider glow-cyan">
            SOFTWARE
          </div>
        </div>
      </div>
    </div>
  );
}
