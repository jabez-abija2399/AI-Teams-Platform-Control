'use client';

import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExplorerFileNode } from '../types/explorer.types';

interface FileNodeProps {
  node: ExplorerFileNode;
  depth: number;
  selected: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function FileNode({
  node,
  depth,
  selected,
  onSelect,
  onContextMenu,
}: FileNodeProps) {
  const pending = node.reviewStatus === 'pending';

  return (
    <button
      onClick={onSelect}
      onContextMenu={onContextMenu}
      style={{ paddingLeft: 8 + depth * 14 }}
      className={cn(
        'group flex w-full items-center gap-1.5 rounded-sm py-[3px] pr-2 text-left text-[12px] leading-tight',
        selected
          ? 'bg-primary/12 text-foreground font-medium'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
      )}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
      <span className="truncate font-mono text-[11px]">{node.name}</span>
      {pending && (
        <span
          title="Pending review — Accept or Reject in editor"
          className="ml-auto shrink-0 rounded-full bg-accent/15 px-1.5 py-px text-[8px] font-bold uppercase tracking-wide text-accent"
        >
          Review
        </span>
      )}
    </button>
  );
}
