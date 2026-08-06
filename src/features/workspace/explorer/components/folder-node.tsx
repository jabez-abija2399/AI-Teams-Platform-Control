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
      className="flex w-full items-center gap-1 rounded-sm py-[3px] pr-2 text-left text-[12px] leading-tight text-foreground/80 hover:bg-muted/70 hover:text-foreground"
    >
      <ChevronRight
        className={cn(
          'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
          expanded && 'rotate-90',
        )}
      />
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary/80" />
      <span className="truncate font-medium">{node.name}</span>
    </button>
  );
}
