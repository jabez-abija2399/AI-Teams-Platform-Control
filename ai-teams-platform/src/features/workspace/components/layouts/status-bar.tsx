'use client';

import { GitBranch, Wifi } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspace.store';

export function StatusBar() {
  const { activeTabId, openTabs } = useWorkspaceStore();
  const activeTab = openTabs.find((t) => t.id === activeTabId);

  return (
    <div className="flex h-6 shrink-0 items-center justify-between border-t bg-primary px-3 text-[11px] text-primary-foreground">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" /> main
        </span>
        <span className="flex items-center gap-1">
          <Wifi className="h-3 w-3" /> Connected
        </span>
      </div>
      <div className="flex items-center gap-3">
        {activeTab && <span>{activeTab.path}</span>}
      </div>
    </div>
  );
}
