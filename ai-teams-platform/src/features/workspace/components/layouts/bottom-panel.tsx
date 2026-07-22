'use client';

import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '../../stores/workspace.store';
import type { BottomPanelTab } from '../../types/workspace.types';

const LivePreview = dynamic(
  () => import('@/features/workspace/preview/components/live-preview').then((m) => ({ default: m.LivePreview })),
  { ssr: false },
);
const CodeReviewPanel = dynamic(
  () => import('@/features/code-review/components/code-review-panel').then((m) => ({ default: m.CodeReviewPanel })),
  { ssr: false },
);

const TABS: { id: BottomPanelTab; label: string }[] = [
  { id: 'preview', label: 'Preview' },
  { id: 'review', label: 'Review' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'problems', label: 'Problems' },
  { id: 'output', label: 'Output' },
  { id: 'logs', label: 'Logs' },
  { id: 'tests', label: 'Tests' },
];

export function BottomPanel() {
  const { layout, activeBottomPanel, setBottomPanel, currentProjectId } = useWorkspaceStore();

  if (layout.bottomPanelCollapsed) return null;

  return (
    <div
      data-tour="terminal"
      className="flex shrink-0 flex-col border-t bg-card"
      style={{ height: layout.bottomPanelHeight }}
    >
      <div className="flex h-8 items-center gap-1 border-b px-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setBottomPanel(tab.id)}
            className={cn(
              'rounded px-2 py-1 text-xs font-medium',
              activeBottomPanel === tab.id
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeBottomPanel === 'preview' && currentProjectId && (
          <LivePreview projectId={currentProjectId} />
        )}
        {activeBottomPanel === 'review' && currentProjectId && (
          <CodeReviewPanel projectId={currentProjectId} />
        )}
        {activeBottomPanel === 'terminal' && (
          <div className="p-3 text-xs text-muted-foreground">Terminal integration is not wired yet.</div>
        )}
        {activeBottomPanel === 'problems' && (
          <div className="p-3 text-xs text-muted-foreground">No problems detected.</div>
        )}
        {activeBottomPanel === 'output' && (
          <div className="p-3 text-xs text-muted-foreground">No output yet.</div>
        )}
        {activeBottomPanel === 'logs' && (
          <div className="p-3 text-xs text-muted-foreground">No logs yet.</div>
        )}
        {activeBottomPanel === 'tests' && (
          <div className="p-3 text-xs text-muted-foreground">No test results yet.</div>
        )}
      </div>
    </div>
  );
}
