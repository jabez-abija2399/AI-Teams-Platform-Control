'use client';

import { GitBranch, FileEdit, FilePlus, FileX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGitStatus } from '../hooks/use-git';

interface StatusIndicatorProps {
  repositoryId: string;
}

export function StatusIndicator({ repositoryId }: StatusIndicatorProps) {
  const { data: status, isLoading } = useGitStatus(repositoryId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
        Loading status...
      </div>
    );
  }

  if (!status) return null;

  const totalChanges = status.staged.length + status.modified.length + status.untracked.length;

  return (
    <div className="space-y-1.5 px-2">
      <div className="flex items-center gap-2">
        <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium">{status.currentBranch}</span>
        {totalChanges > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {totalChanges} change{totalChanges !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {status.staged.length > 0 && (
        <div className="space-y-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-green-600 dark:text-green-400">
            Staged
          </span>
          {status.staged.map((file) => (
            <div
              key={file}
              className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs hover:bg-muted/30"
            >
              <FilePlus className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400" />
              <span className="truncate font-mono">{file}</span>
            </div>
          ))}
        </div>
      )}

      {status.modified.length > 0 && (
        <div className="space-y-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
            Modified
          </span>
          {status.modified.map((file) => (
            <div
              key={file}
              className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs hover:bg-muted/30"
            >
              <FileEdit className="h-3 w-3 shrink-0 text-yellow-600 dark:text-yellow-400" />
              <span className="truncate font-mono">{file}</span>
            </div>
          ))}
        </div>
      )}

      {status.untracked.length > 0 && (
        <div className="space-y-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Untracked
          </span>
          {status.untracked.map((file) => (
            <div
              key={file}
              className="flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs hover:bg-muted/30"
            >
              <FileX className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="truncate font-mono">{file}</span>
            </div>
          ))}
        </div>
      )}

      {!status.hasChanges && (
        <p className="text-xs text-muted-foreground py-1">
          Working tree clean
        </p>
      )}
    </div>
  );
}
