'use client';

import { PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { useResizablePanel } from '../../hooks/use-resizable-panel';
import { MIN_PANEL_WIDTH, MAX_AI_PANEL_WIDTH } from '../../constants/workspace.constants';

export function AIPanel({ children }: { children: React.ReactNode }) {
  const { layout, setAIPanelWidth, toggleAIPanel } = useWorkspaceStore();
  const { onMouseDown } = useResizablePanel({
    direction: 'horizontal',
    onResize: (w) => setAIPanelWidth(w),
    min: MIN_PANEL_WIDTH,
    max: MAX_AI_PANEL_WIDTH,
    invert: true,
  });

  if (layout.aiPanelCollapsed) return null;

  return (
    <div
      className="relative flex shrink-0 flex-col border-l bg-card"
      style={{ width: layout.aiPanelWidth }}
    >
      <div
        onMouseDown={(e) => onMouseDown(e, layout.aiPanelWidth)}
        className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-ring/50"
      />
      <div className="flex h-9 items-center justify-between border-b px-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          AI Team
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleAIPanel}>
          <PanelRightClose className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
