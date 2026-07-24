'use client';

import { useEffect } from 'react';
import { PanelRightClose, PanelRightOpen, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        toggleAIPanel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleAIPanel]);

  if (layout.aiPanelCollapsed) {
    return (
      <div className="flex shrink-0 items-center border-l bg-card px-0.5 z-10 select-none">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-5 rounded-none text-muted-foreground hover:text-foreground"
          onClick={toggleAIPanel}
          title="Show AI Team panel (Ctrl+L)"
        >
          <PanelRightOpen className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
        </Button>
      </div>
    );
  }

  return (
    <div
      data-tour="ai-panel"
      className="relative flex shrink-0 flex-col border-l bg-card text-card-foreground z-10 select-none"
      style={{ width: layout.aiPanelWidth }}
    >
      <div
        onMouseDown={(e) => onMouseDown(e, layout.aiPanelWidth)}
        className="absolute left-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
      />
      <div className="flex h-9 items-center justify-between border-b px-3 bg-muted/40">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
            AI Team Assistant
          </span>
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[9px] text-muted-foreground font-mono">
            Ctrl+L
          </kbd>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={toggleAIPanel}
        >
          <PanelRightClose className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
