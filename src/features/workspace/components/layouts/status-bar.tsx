'use client';

import { GitBranch, Circle, Columns2, Rocket } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/workspace.store';

export function StatusBar() {
  const { activeTabId, openTabs, layout, setActivity, togglePreviewSplit } = useWorkspaceStore();
  const activeTab = openTabs.find((t) => t.id === activeTabId);

  return (
    <footer className="z-20 flex h-6 shrink-0 items-center justify-between border-t border-border/80 bg-primary px-3 text-[10px] text-primary-foreground/90 select-none">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1 font-medium">
          <GitBranch className="h-3 w-3" />
          main
        </span>
        <span className="inline-flex items-center gap-1 opacity-90">
          <Circle className="h-2 w-2 fill-emerald-300 text-emerald-300" />
          Ready
        </span>
        {activeTab && (
          <span className="hidden max-w-[280px] truncate font-mono opacity-80 sm:inline">
            {activeTab.path}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className="inline-flex items-center gap-1 opacity-90 transition-opacity hover:opacity-100"
          onClick={() => togglePreviewSplit()}
          title="Toggle preview split"
        >
          <Columns2 className="h-3 w-3" />
          {layout.previewSplit ? 'Preview on' : 'Preview off'}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 font-semibold opacity-95 transition-opacity hover:opacity-100"
          onClick={() => setActivity('deployment')}
          title="Open Deploy (explicit)"
        >
          <Rocket className="h-3 w-3" />
          Deploy
        </button>
        <span className="opacity-70">UTF-8</span>
        <span className="opacity-70">TypeScript</span>
      </div>
    </footer>
  );
}
