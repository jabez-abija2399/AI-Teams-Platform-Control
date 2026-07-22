'use client';

import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '../../stores/workspace.store';
import type { BottomPanelTab } from '../../types/workspace.types';

const TABS: { id: BottomPanelTab; label: string }[] = [
  { id: 'terminal', label: 'Terminal' },
  { id: 'problems', label: 'Problems' },
  { id: 'output', label: 'Output' },
  { id: 'logs', label: 'Logs' },
  { id: 'tests', label: 'Tests' },
];

export function BottomPanel() {
  const { layout, activeBottomPanel, setBottomPanel } = useWorkspaceStore();

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
      <div className="flex-1 overflow-auto p-3 text-xs text-muted-foreground">
        {activeBottomPanel === 'terminal' && 'Terminal integration is not wired yet.'}
        {activeBottomPanel === 'problems' && 'No problems detected.'}
        {activeBottomPanel === 'output' && 'No output yet.'}
        {activeBottomPanel === 'logs' && 'No logs yet.'}
        {activeBottomPanel === 'tests' && 'No test results yet.'}
      </div>
    </div>
  );
}
