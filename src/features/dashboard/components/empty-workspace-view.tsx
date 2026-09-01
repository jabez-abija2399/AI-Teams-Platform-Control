'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Brain, Layers, Sparkles, Terminal, ArrowDown } from 'lucide-react';
import { ROUTES } from '@/config/constants';

export function EmptyWorkspaceView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
      <div className="max-w-lg flex flex-col items-center gap-6">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 border border-outline-variant/60 bg-surface-container-low px-3 py-1.5 rounded-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            No Active Projects
          </span>
        </div>

        <div>
          <h1 className="font-sans text-3xl md:text-4xl font-bold text-on-surface leading-tight mb-3">
            Your first software project starts here.
          </h1>
          <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
            Describe what you want to build. HibirDev AI takes it through product
            definition, architecture, design, and implementation.
          </p>
        </div>

        <Link href={`${ROUTES.projects}/new`}>
          <button
            type="button"
            className="bg-primary text-black font-mono text-xs font-bold px-6 py-3 rounded-sm flex items-center gap-2 hover:bg-primary-container transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Your First Project
          </button>
        </Link>

        {/* Pipeline spine */}
        <div className="mt-4 flex flex-col items-center gap-2 font-mono text-[11px] font-bold text-on-surface-variant">
          <div className="border border-outline-variant/60 bg-surface-container-low px-4 py-2 rounded-sm uppercase text-primary">
            IDEA
          </div>
          {[
            { icon: Brain, label: 'CEO' },
            { icon: Layers, label: 'ARCHITECT' },
            { icon: Sparkles, label: 'DESIGNER' },
            { icon: Terminal, label: 'DEVELOPER' },
          ].map(({ icon: Icon, label }) => (
            <React.Fragment key={label}>
              <ArrowDown className="w-3.5 h-3.5 text-primary" />
              <div className="border border-outline-variant/60 bg-surface-container-low px-4 py-2 rounded-sm flex items-center gap-2 uppercase">
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            </React.Fragment>
          ))}
          <ArrowDown className="w-3.5 h-3.5 text-primary" />
          <div className="border border-primary/30 bg-primary/5 text-primary px-5 py-2 rounded-sm font-bold uppercase tracking-wider">
            SOFTWARE
          </div>
        </div>
      </div>
    </div>
  );
}
