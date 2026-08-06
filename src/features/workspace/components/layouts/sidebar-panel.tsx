'use client';

import { useWorkspaceStore } from '../../stores/workspace.store';
import { useResizablePanel } from '../../hooks/use-resizable-panel';
import { MIN_PANEL_WIDTH, MAX_SIDEBAR_WIDTH, ACTIVITY_ITEMS } from '../../constants/workspace.constants';
import { ChevronLeft } from 'lucide-react';
import * as Icons from 'lucide-react';

export function SidebarPanel({ children }: { children: React.ReactNode }) {
  const { layout, setSidebarWidth, selectedActivity, toggleSidebar } = useWorkspaceStore();
  const { onMouseDown } = useResizablePanel({
    direction: 'horizontal',
    onResize: setSidebarWidth,
    min: MIN_PANEL_WIDTH,
    max: MAX_SIDEBAR_WIDTH,
  });

  if (layout.sidebarCollapsed) return null;

  const currentActivity = ACTIVITY_ITEMS.find((a) => a.id === selectedActivity);
  const Icon = (currentActivity?.icon && (Icons[currentActivity.icon as keyof typeof Icons] as Icons.LucideIcon)) || Icons.Folder;

  return (
    <div
      className="relative flex shrink-0 flex-col border-r bg-card text-card-foreground select-none z-10"
      style={{ width: layout.sidebarWidth }}
    >
      <div className="flex h-9 items-center justify-between border-b border-border/70 bg-muted/30 px-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground">
          <Icon className="h-3.5 w-3.5 text-primary" />
          <span>{currentActivity?.label || selectedActivity.replace('-', ' ')}</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 hover:bg-secondary text-muted-foreground hover:text-foreground rounded transition-colors"
          title="Collapse Sidebar"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
      <div
        onMouseDown={(e) => onMouseDown(e, layout.sidebarWidth)}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
      />
    </div>
  );
}
