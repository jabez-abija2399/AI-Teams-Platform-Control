'use client';

import { useWorkspaceStore } from '../../stores/workspace.store';
import { useResizablePanel } from '../../hooks/use-resizable-panel';
import { MIN_PANEL_WIDTH, MAX_SIDEBAR_WIDTH } from '../../constants/workspace.constants';

export function SidebarPanel({ children }: { children: React.ReactNode }) {
  const { layout, setSidebarWidth, selectedActivity } = useWorkspaceStore();
  const { onMouseDown } = useResizablePanel({
    direction: 'horizontal',
    onResize: setSidebarWidth,
    min: MIN_PANEL_WIDTH,
    max: MAX_SIDEBAR_WIDTH,
  });

  if (layout.sidebarCollapsed) return null;

  return (
    <div
      className="relative flex shrink-0 flex-col border-r bg-card"
      style={{ width: layout.sidebarWidth }}
    >
      <div className="flex h-9 items-center border-b px-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {selectedActivity.replace('-', ' ')}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
      <div
        onMouseDown={(e) => onMouseDown(e, layout.sidebarWidth)}
        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-ring/50"
      />
    </div>
  );
}
