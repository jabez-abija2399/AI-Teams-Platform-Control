'use client';

import { useState } from 'react';
import { GitCommit, ChevronDown, ChevronRight, FileCode } from 'lucide-react';
import { useGitCommits, useGitChanges } from '../hooks/use-git';
import type { GitCommitInfo } from '../types';

interface CommitHistoryProps {
  repositoryId: string;
  branchId?: string;
  limit?: number;
}

export function CommitHistory({ repositoryId, branchId, limit = 20 }: CommitHistoryProps) {
  const { data: commits = [], isLoading } = useGitCommits(repositoryId, branchId, limit);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
        <GitCommit className="h-4 w-4 animate-pulse" />
        Loading commits...
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-2 pb-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          History
        </span>
        <span className="text-xs text-muted-foreground">{commits.length} commits</span>
      </div>

      {commits.map((commit, index) => (
        <CommitItem key={commit.id} commit={commit} isLatest={index === 0} />
      ))}

      {commits.length === 0 && (
        <p className="px-2 py-4 text-center text-xs text-muted-foreground">
          No commits yet
        </p>
      )}
    </div>
  );
}

function CommitItem({ commit, isLatest }: { commit: GitCommitInfo; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(false);

  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  return (
    <div className="group">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/50 transition-colors"
      >
        <div className="relative mt-0.5">
          <GitCommit className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          {isLatest && (
            <div className="absolute -bottom-1 left-1/2 h-2 w-px bg-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{commit.message}</span>
            {expanded ? (
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{commit.author}</span>
            <span>·</span>
            <span>{formatRelativeTime(commit.createdAt)}</span>
            {commit.changeCount > 0 && (
              <>
                <span>·</span>
                <span>{commit.changeCount} file{commit.changeCount !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>
        </div>
      </button>

      {expanded && <CommitChanges commitId={commit.id} />}
    </div>
  );
}

function CommitChanges({ commitId }: { commitId: string }) {
  const { data: changes = [], isLoading } = useGitChanges(commitId);

  if (isLoading) {
    return (
      <div className="ml-7 pl-2 text-xs text-muted-foreground py-1">
        Loading changes...
      </div>
    );
  }

  const TYPE_COLORS: Record<string, string> = {
    CREATE: 'text-green-600 dark:text-green-400',
    MODIFY: 'text-yellow-600 dark:text-yellow-400',
    DELETE: 'text-red-600 dark:text-red-400',
    RENAME: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="ml-7 pl-2 space-y-0.5 pb-1">
      {changes.map((change) => (
        <div
          key={change.id}
          className="flex items-center gap-2 rounded px-2 py-0.5 text-xs hover:bg-muted/30"
        >
          <FileCode className="h-3 w-3 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate font-mono">{change.file}</span>
          <span className={`font-medium ${TYPE_COLORS[change.type] ?? ''}`}>
            {change.type}
          </span>
        </div>
      ))}
    </div>
  );
}
