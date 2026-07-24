'use client';

import { GitBranch, Wifi, CheckCircle2 } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspace.store';

export function StatusBar() {
  const { activeTabId, openTabs } = useWorkspaceStore();
  const activeTab = openTabs.find((t) => t.id === activeTabId);

  return (
    <div className="flex h-6 shrink-0 items-center justify-between border-t bg-card px-3 text-[11px] text-muted-foreground font-mono select-none z-20">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-foreground">
          <GitBranch className="h-3 w-3 text-sky-600 dark:text-sky-400" /> main
        </span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
          <Wifi className="h-3 w-3" /> Connected
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-sky-600 dark:text-sky-400" /> AST Sync Ready
        </span>
      </div>
      <div className="flex items-center gap-3">
        {activeTab && <span className="text-foreground font-medium">{activeTab.path}</span>}
        <span>UTF-8</span>
        <span>TypeScript</span>
      </div>
    </div>
  );
}
