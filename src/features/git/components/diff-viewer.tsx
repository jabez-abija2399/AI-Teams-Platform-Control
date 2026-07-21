'use client';

import { useState } from 'react';
import { FileCode, Plus, Minus, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGitDiff } from '../hooks/use-git';
import type { GitDiff } from '../types';

interface DiffViewerProps {
  commitId: string | null;
}

type ViewMode = 'unified' | 'split';

export function DiffViewer({ commitId }: DiffViewerProps) {
  const { data: diffs = [], isLoading } = useGitDiff(commitId);
  const [viewMode, setViewMode] = useState<ViewMode>('unified');

  if (!commitId) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Select a commit to view its diff
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Loading diff...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Changes
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === 'unified' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={() => setViewMode('unified')}
          >
            <ArrowLeftRight className="h-3 w-3" />
          </Button>
          <Button
            variant={viewMode === 'split' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={() => setViewMode('split')}
          >
            <FileCode className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {diffs.map((diff) => (
          <DiffFile key={diff.file} diff={diff} viewMode={viewMode} />
        ))}
      </div>

      {diffs.length === 0 && (
        <p className="py-8 text-center text-xs text-muted-foreground">
          No changes in this commit
        </p>
      )}
    </div>
  );
}

function DiffFile({ diff, viewMode }: { diff: GitDiff; viewMode: ViewMode }) {
  const [expanded, setExpanded] = useState(true);
  const lines = diff.content.split('\n');

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 bg-muted/30 px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left truncate font-mono text-xs">{diff.file}</span>
        <div className="flex items-center gap-2">
          {diff.additions > 0 && (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-[10px]">
              <Plus className="h-2.5 w-2.5" />
              {diff.additions}
            </Badge>
          )}
          {diff.deletions > 0 && (
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 text-[10px]">
              <Minus className="h-2.5 w-2.5" />
              {diff.deletions}
            </Badge>
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t">
          {viewMode === 'unified' ? (
            <UnifiedDiffView lines={lines} />
          ) : (
            <SplitDiffView lines={lines} />
          )}
        </div>
      )}
    </div>
  );
}

function UnifiedDiffView({ lines }: { lines: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <tbody>
          {lines.map((line, index) => {
            const trimmedLine = line.trimStart();
            let bgColor = 'bg-transparent';
            let textColor = 'text-foreground';

            if (trimmedLine.startsWith('+') && !trimmedLine.startsWith('+++')) {
              bgColor = 'bg-green-50 dark:bg-green-950/30';
              textColor = 'text-green-800 dark:text-green-300';
            } else if (trimmedLine.startsWith('-') && !trimmedLine.startsWith('---')) {
              bgColor = 'bg-red-50 dark:bg-red-950/30';
              textColor = 'text-red-800 dark:text-red-300';
            } else if (trimmedLine.startsWith('@@')) {
              bgColor = 'bg-blue-50 dark:bg-blue-950/30';
              textColor = 'text-blue-600 dark:text-blue-400';
            }

            return (
              <tr key={index} className={bgColor}>
                <td className="w-12 px-2 py-0.5 text-right text-muted-foreground select-none border-r border-border/50">
                  {index + 1}
                </td>
                <td className={`px-2 py-0.5 ${textColor} whitespace-pre`}>
                  {line || ' '}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SplitDiffView({ lines }: { lines: string[] }) {
  const leftLines: string[] = [];
  const rightLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('-') && !trimmed.startsWith('---')) {
      leftLines.push(line);
      rightLines.push('');
    } else if (trimmed.startsWith('+') && !trimmed.startsWith('+++')) {
      leftLines.push('');
      rightLines.push(line);
    } else if (trimmed.startsWith('@@')) {
      leftLines.push(line);
      rightLines.push('');
    } else {
      leftLines.push(line);
      rightLines.push(line);
    }
  }

  return (
    <div className="grid grid-cols-2 divide-x divide-border overflow-x-auto">
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <tbody>
            {leftLines.map((line, index) => {
              const trimmedLine = line.trimStart();
              let bgColor = 'bg-transparent';
              let textColor = 'text-foreground';

              if (trimmedLine.startsWith('-') && !trimmedLine.startsWith('---')) {
                bgColor = 'bg-red-50 dark:bg-red-950/30';
                textColor = 'text-red-800 dark:text-red-300';
              } else if (trimmedLine.startsWith('@@')) {
                bgColor = 'bg-blue-50 dark:bg-blue-950/30';
                textColor = 'text-blue-600 dark:text-blue-400';
              }

              return (
                <tr key={index} className={bgColor}>
                  <td className="w-10 px-1.5 py-0.5 text-right text-muted-foreground select-none border-r border-border/50">
                    {line ? index + 1 : ''}
                  </td>
                  <td className={`px-1.5 py-0.5 ${textColor} whitespace-pre`}>
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <tbody>
            {rightLines.map((line, index) => {
              const trimmedLine = line.trimStart();
              let bgColor = 'bg-transparent';
              let textColor = 'text-foreground';

              if (trimmedLine.startsWith('+') && !trimmedLine.startsWith('+++')) {
                bgColor = 'bg-green-50 dark:bg-green-950/30';
                textColor = 'text-green-800 dark:text-green-300';
              } else if (trimmedLine.startsWith('@@')) {
                bgColor = 'bg-blue-50 dark:bg-blue-950/30';
                textColor = 'text-blue-600 dark:text-blue-400';
              }

              return (
                <tr key={index} className={bgColor}>
                  <td className="w-10 px-1.5 py-0.5 text-right text-muted-foreground select-none border-r border-border/50">
                    {line ? index + 1 : ''}
                  </td>
                  <td className={`px-1.5 py-0.5 ${textColor} whitespace-pre`}>
                    {line || ' '}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
