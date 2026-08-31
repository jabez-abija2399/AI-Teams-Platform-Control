'use client';

import React from 'react';
import { Brain, Layers, Sparkles, Terminal, CheckCircle2, RefreshCw, Clock } from 'lucide-react';

export function AgentRosterGrid() {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        YOUR AI TEAM
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CEO */}
        <div className="bg-surface p-4 rounded-lg border border-white/10 flex flex-col gap-3 opacity-60 hover:opacity-100 transition-all">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-on-surface-variant" />
              <span className="font-sans text-xs font-bold text-foreground">CEO</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-on-surface-variant" />
          </div>
          <p className="font-mono text-[11px] text-on-surface-variant">Product Spec</p>
          <div className="mt-auto pt-2 flex justify-between items-center font-mono text-[10px] text-on-surface-variant">
            <span>STATUS: DONE</span>
            <span>100%</span>
          </div>
        </div>

        {/* Architect */}
        <div className="bg-surface p-4 rounded-lg border border-white/10 flex flex-col gap-3 opacity-60 hover:opacity-100 transition-all">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-on-surface-variant" />
              <span className="font-sans text-xs font-bold text-foreground">Architect</span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-on-surface-variant" />
          </div>
          <p className="font-mono text-[11px] text-on-surface-variant">Arch Spec</p>
          <div className="mt-auto pt-2 flex justify-between items-center font-mono text-[10px] text-on-surface-variant">
            <span>STATUS: DONE</span>
            <span>100%</span>
          </div>
        </div>

        {/* Designer (Active) */}
        <div className="bg-surface-container-low p-4 rounded-lg border border-primary/40 flex flex-col gap-3 relative overflow-hidden glow-border">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-sans text-xs font-bold text-foreground">Designer</span>
            </div>
            <RefreshCw className="w-4 h-4 text-primary animate-spin" />
          </div>
          <p className="font-mono text-[11px] text-on-surface-variant">Design Spec</p>
          <div className="mt-auto pt-2 flex justify-between items-center font-mono text-[10px] text-primary font-bold">
            <span>STATUS: WORKING</span>
            <span>85%</span>
          </div>
        </div>

        {/* Developer */}
        <div className="bg-surface p-4 rounded-lg border border-white/10 flex flex-col gap-3 opacity-40 hover:opacity-100 transition-all">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-on-surface-variant" />
              <span className="font-sans text-xs font-bold text-foreground">Developer</span>
            </div>
            <Clock className="w-4 h-4 text-on-surface-variant" />
          </div>
          <p className="font-mono text-[11px] text-on-surface-variant">Implementation</p>
          <div className="mt-auto pt-2 flex justify-between items-center font-mono text-[10px] text-on-surface-variant">
            <span>STATUS: WAITING</span>
            <span>0%</span>
          </div>
        </div>
      </div>
    </section>
  );
}
