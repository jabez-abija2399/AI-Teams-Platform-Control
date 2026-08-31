'use client';

import React from 'react';
import { Search, Bell, ChevronRight } from 'lucide-react';

interface DashboardHeaderProps {
  userName?: string | null;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 md:px-8 shrink-0 sticky top-0 bg-background/90 backdrop-blur-md z-20">
      <div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-0.5">
          <span>WORKSPACE</span>
          <ChevronRight className="w-3 h-3 text-on-surface-variant/60" />
          <span className="text-foreground font-bold">OVERVIEW</span>
        </div>
        <p className="font-sans text-xs text-on-surface-variant">
          Good morning. Here's the current state of your software projects.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Search Workspace"
          className="w-8 h-8 flex items-center justify-center rounded border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          type="button"
          aria-label="Notifications"
          className="w-8 h-8 flex items-center justify-center rounded border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded bg-primary text-black font-mono font-bold flex items-center justify-center text-xs">
          {userName?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
