'use client';

import { ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExplorerFolderNode } from '../types/explorer.types';

interface FolderNodeProps {
  node: ExplorerFolderNode;
  depth: number;
  expanded: boolean;
  onToggle: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function FolderNode({
  node,
  depth,
  expanded,
  onToggle,
  onContextMenu,
}: FolderNodeProps) {
  const Icon = expanded ? FolderOpen : Folder;
  return (
    <button
      onClick={onToggle}
      onContextMenu={onContextMenu}
      style={{ paddingLeft: 4 + depth * 14 }}
      className="flex w-full items-center gap-1 rounded-sm py-1 pr-2 text-left text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
    >
      <ChevronRight
        className={cn(
          'h-3.5 w-3.5 shrink-0 transition-transform',
          expanded && 'rotate-90',
        )}
      />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}
