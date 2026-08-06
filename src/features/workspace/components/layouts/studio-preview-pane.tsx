'use client';

import dynamic from 'next/dynamic';
import { CheckCheck, Eye, Minimize2, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { useResizablePanel } from '../../hooks/use-resizable-panel';
import { useCallback, useState } from 'react';

const VibePreview = dynamic(
  () =>
    import('@/features/workspace/preview/components/vibe-preview').then((m) => ({
      default: m.VibePreview,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-[var(--brand-cream)] text-muted-foreground">
        <div className="h-8 w-8 animate-pulse rounded-full bg-primary/15" />
        <p className="text-xs font-medium">Opening Preview…</p>
      </div>
    ),
  },
);

/**
 * Studio Preview pane — Yacht Club workbench chrome wrapping production VibePreview.
 */
export function StudioPreviewPane({ projectId }: { projectId: string }) {
  const { layout, setPreviewPaneWidth, setPreviewSplit, setBottomPanel, toggleBottomPanel } =
    useWorkspaceStore();
  const { onMouseDown } = useResizablePanel({
    direction: 'horizontal',
    onResize: setPreviewPaneWidth,
    min: 360,
    max: 960,
    invert: true,
  });
  const [accepting, setAccepting] = useState(false);

  const acceptAllPending = useCallback(async () => {
    setAccepting(true);
    try {
      await fetch(`/api/projects/${projectId}/explorer/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept-all' }),
      });
      window.dispatchEvent(new CustomEvent('explorer-refresh'));
      window.dispatchEvent(new CustomEvent('studio-preview-reload'));
    } finally {
      setAccepting(false);
    }
  }, [projectId]);

  if (!layout.previewSplit) return null;

  return (
    <div
      className="relative flex shrink-0 flex-col border-l border-border/70 bg-[var(--brand-cream)] text-foreground"
      style={{ width: layout.previewPaneWidth }}
      data-studio="preview-pane"
    >
      <div
        onMouseDown={(e) => onMouseDown(e, layout.previewPaneWidth)}
        className="absolute left-0 top-0 z-20 h-full w-1 cursor-col-resize hover:bg-primary/50"
      />

      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-white/95 px-3 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/12 text-primary">
            <Eye className="h-3 w-3" />
          </span>
          <span className="font-heading text-[13px] font-semibold tracking-tight text-foreground">
            Preview
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            title="Accept all pending files"
            disabled={accepting}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
            onClick={() => void acceptAllPending()}
          >
            <CheckCheck className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Reload preview"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => window.dispatchEvent(new CustomEvent('studio-preview-reload'))}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Move preview to bottom"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => {
              setPreviewSplit(false);
              setBottomPanel('preview');
              const { layout: L } = useWorkspaceStore.getState();
              if (L.bottomPanelCollapsed) toggleBottomPanel();
            }}
          >
            <Minimize2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Close preview"
            className={cn(
              'rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            )}
            onClick={() => setPreviewSplit(false)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <VibePreview projectId={projectId} />
      </div>
    </div>
  );
}
