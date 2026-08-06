'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Columns2,
  Command,
  Eye,
  Play,
  Rocket,
  Search,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '../../stores/workspace.store';

export function TopNav({
  projectName,
  userName,
  onBackToMission,
}: {
  projectName: string;
  userName: string;
  onBackToMission?: () => void;
}) {
  const {
    togglePreviewSplit,
    layout,
    setActivity,
    setPreviewSplit,
    enterStudioFocus,
    toggleSimpleMode,
    simpleMode,
  } = useWorkspaceStore();

  const openDeploy = () => {
    setPreviewSplit(false);
    setActivity('deployment');
  };

  const runPreview = () => {
    enterStudioFocus({ activity: 'explorer' });
    window.dispatchEvent(new CustomEvent('toggle-workspace-preview'));
  };

  return (
    <header className="z-20 flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-card/95 px-2.5 backdrop-blur-md select-none sm:px-3">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
        {onBackToMission ? (
          <button
            type="button"
            onClick={onBackToMission}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Back to Mission Control"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mission</span>
          </button>
        ) : (
          <Link
            href="/dashboard/projects"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Back to Projects"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}

        <div className="hidden h-4 w-px bg-border sm:block" />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-semibold tracking-tight text-foreground">
              {projectName}
            </span>
            <span className="hidden items-center gap-1 rounded border border-primary/20 bg-primary/8 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary sm:inline-flex">
              <Sparkles className="h-2.5 w-2.5" />
              Studio
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="hidden max-w-md flex-1 items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/25 hover:bg-muted/70 md:flex"
        title="Search files"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Search files…</span>
        <kbd className="ml-auto inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => togglePreviewSplit()}
          className={cn(
            'hidden items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors sm:inline-flex',
            layout.previewSplit
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border bg-background text-muted-foreground hover:text-foreground',
          )}
          title="Toggle side Preview"
        >
          <Columns2 className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Split</span>
        </button>

        <button
          type="button"
          onClick={runPreview}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          title="Run & Preview"
        >
          <Play className="h-3 w-3 fill-current" />
          <span className="hidden sm:inline">Preview</span>
          <Eye className="h-3 w-3 sm:hidden" />
        </button>

        <button
          type="button"
          onClick={openDeploy}
          className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/15"
          title="Deploy to production (explicit — never auto)"
        >
          <Rocket className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Deploy</span>
        </button>

        <div className="hidden h-4 w-px bg-border lg:block" />

        <button
          type="button"
          onClick={toggleSimpleMode}
          className="hidden rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline"
          title="Toggle Creator / Developer mode"
        >
          {simpleMode ? 'Creator' : 'Developer'}
        </button>

        <span className="hidden max-w-[100px] truncate rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-foreground xl:inline">
          {userName}
        </span>
      </div>
    </header>
  );
}
