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
  return (
    <button
      onClick={onSelect}
      onContextMenu={onContextMenu}
      style={{ paddingLeft: 8 + depth * 14 }}
      className={cn(
        'flex w-full items-center gap-1.5 rounded-sm py-1 pr-2 text-left text-xs',
        selected
          ? 'bg-secondary text-foreground'
          : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
      )}
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
