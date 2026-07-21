'use client';

import { FilePlus, FolderPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExplorerToolbarProps {
  onNewFile: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
}

export function ExplorerToolbar({
  onNewFile,
  onNewFolder,
  onRefresh,
}: ExplorerToolbarProps) {
  return (
    <div className="flex items-center justify-end gap-0.5 border-b px-2 py-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onNewFile}
        title="New file"
      >
        <FilePlus className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onNewFolder}
        title="New folder"
      >
        <FolderPlus className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onRefresh}
        title="Refresh"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
