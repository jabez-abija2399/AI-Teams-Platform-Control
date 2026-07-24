'use client';

import { Search, ArrowLeft, Sparkles, Folder } from 'lucide-react';
import Link from 'next/link';

export function TopNav({ projectName, userName }: { projectName: string; userName: string }) {
  return (
    <div className="flex h-11 shrink-0 items-center justify-between border-b bg-card px-3 text-foreground select-none z-20">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/projects"
          className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground rounded transition-colors"
          title="Back to Projects"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-semibold tracking-wide text-foreground">{projectName}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary border border-border text-foreground rounded-full text-[11px] font-medium">
          <Sparkles className="w-3 h-3 text-sky-600 dark:text-sky-400 animate-pulse" />
          <span>AI Multi-Agent Sync</span>
        </div>
      </div>

      <button className="hidden w-72 items-center gap-2 rounded-md border border-input bg-background px-3 py-1 text-xs text-muted-foreground hover:border-foreground/20 transition-colors sm:flex">
        <Search className="h-3.5 w-3.5" />
        <span>Search or jump to file...</span>
        <kbd className="ml-auto rounded border bg-muted px-1 py-0.5 text-[9px]">
          Ctrl+K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const event = new CustomEvent('toggle-workspace-preview');
            window.dispatchEvent(event);
          }}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          title="Run & View Application Preview"
        >
          <span>▶ Run & Preview</span>
        </button>

        <span className="text-xs text-muted-foreground font-medium">Developer:</span>
        <span className="text-xs text-foreground font-semibold px-2 py-0.5 bg-secondary border border-border rounded">
          {userName}
        </span>
      </div>
    </div>
  );
}
