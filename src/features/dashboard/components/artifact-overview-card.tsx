'use client';

import React from 'react';
import { FileText, Code, Sparkles, Terminal } from 'lucide-react';

export function ArtifactOverviewCard() {
  return (
    <section className="bg-surface rounded-lg p-6 border border-white/10 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          ARTIFACT OVERVIEW
        </h3>
        <a href="#artifacts" className="font-mono text-xs text-primary hover:underline font-bold">
          View All
        </a>
      </div>

      <div className="flex flex-col gap-2 font-mono text-xs">
        {/* Item 1 */}
        <div className="flex items-center justify-between p-3 bg-background border border-white/10 rounded">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-on-surface-variant" />
            <div>
              <p className="text-foreground font-bold">PRD_StudyMate_v1.md</p>
              <p className="text-[10px] text-on-surface-variant">Product Specification</p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] bg-surface-container-high border border-white/10 text-on-surface-variant rounded uppercase font-bold">
            READY
          </span>
        </div>

        {/* Item 2 */}
        <div className="flex items-center justify-between p-3 bg-background border border-white/10 rounded">
          <div className="flex items-center gap-3">
            <Code className="w-4 h-4 text-on-surface-variant" />
            <div>
              <p className="text-foreground font-bold">Arch_StudyMate_v1.json</p>
              <p className="text-[10px] text-on-surface-variant">Architecture Specification</p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] bg-surface-container-high border border-white/10 text-on-surface-variant rounded uppercase font-bold">
            READY
          </span>
        </div>

        {/* Item 3 (Active) */}
        <div className="flex items-center justify-between p-3 bg-background border border-primary/40 rounded relative">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
          <div className="flex items-center gap-3 pl-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <div>
              <p className="text-foreground font-bold">Design_System_StudyMate.css</p>
              <p className="text-[10px] text-on-surface-variant">Design Tokens & Guidelines</p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] bg-primary/10 border border-primary text-primary rounded uppercase font-bold">
            IN PROGRESS
          </span>
        </div>

        {/* Item 4 */}
        <div className="flex items-center justify-between p-3 bg-background border border-white/10 rounded opacity-50">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-on-surface-variant" />
            <div>
              <p className="text-foreground font-bold">Source_Code_StudyMate.zip</p>
              <p className="text-[10px] text-on-surface-variant">Implementation Files</p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] bg-surface-container-high border border-white/10 text-on-surface-variant rounded uppercase font-bold">
            PENDING
          </span>
        </div>
      </div>
    </section>
  );
}
