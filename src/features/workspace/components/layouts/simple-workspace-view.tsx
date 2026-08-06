'use client';

import { useEffect, useState } from 'react';
import { Maximize2, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TopNav } from './top-nav';
import { ActivityBar } from './activity-bar';
import { SidebarPanel } from './sidebar-panel';
import { EditorArea } from './editor-area';
import { BottomPanel } from './bottom-panel';
import { AIPanel } from './ai-panel';
import { StatusBar } from './status-bar';
import { SimpleTechnicalToggle } from '@/features/onboarding/components/simple-technical-toggle';
import { SpotlightTour } from '@/features/onboarding/components/spotlight-tour';
import { LivePreview } from '@/features/workspace/preview/components/live-preview';
import { ChangeHistoryDropdown } from '@/features/code-engine/components/change-history-dropdown';

interface SimpleWorkspaceViewProps {
  projectName: string;
  userName: string;
  projectId: string;
  sidebarContent: React.ReactNode;
  aiPanelContent: React.ReactNode;
  simpleMode: boolean;
  onToggleMode: () => void;
  tourCompleted: boolean;
  onCompleteTour: () => void;
}

export function SimpleWorkspaceView({
  projectName,
  userName,
  projectId,
  sidebarContent,
  aiPanelContent,
  simpleMode,
  onToggleMode,
  tourCompleted,
  onCompleteTour,
}: SimpleWorkspaceViewProps) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const effectiveSimpleMode = simpleMode || !isDesktop;

  if (!effectiveSimpleMode) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground font-sans">
        <TopNav projectName={projectName} userName={userName} />
        <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/20 shrink-0">
          <ChangeHistoryDropdown projectId={projectId} />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/20 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-all"
              onClick={onToggleMode}
            >
              <Sparkles className="h-3 w-3" /> Back to Creator Mode
            </Button>
          </div>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <ActivityBar />
          <SidebarPanel>{sidebarContent}</SidebarPanel>
          <div className="flex flex-1 flex-col overflow-hidden">
            <EditorArea />
            <BottomPanel />
          </div>
          <AIPanel>{aiPanelContent}</AIPanel>
        </div>
        <StatusBar />
        {!tourCompleted && <SpotlightTour onComplete={onCompleteTour} />}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-100 font-sans">
      {/* Sleek Minimal Header */}
      <header className="flex h-14 shrink-0 items-center justify-between px-6 py-2 z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/projects"
            className="p-1.5 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-white/10 rounded-lg transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5 border-l border-slate-300/50 dark:border-white/10 pl-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">{projectName}</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-slate-200/50 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 text-[10px] font-semibold tracking-wide uppercase text-slate-600 dark:text-slate-400">
            Creator Mode
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ChangeHistoryDropdown projectId={projectId} />
          {isDesktop && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 rounded-full bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-all font-medium text-xs px-4"
              onClick={onToggleMode}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Switch to Developer IDE</span>
            </Button>
          )}
        </div>
      </header>

      {!isDesktop && (
        <p className="border-y border-amber-200 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500/20 px-4 py-2 text-center text-[11px] font-medium text-amber-800 dark:text-amber-400">
          The full developer workspace is only available on desktop screens.
        </p>
      )}

      {/* Main Grid Content */}
      <main className="flex-1 flex gap-4 p-4 pt-0 min-h-0 overflow-hidden max-w-[1800px] mx-auto w-full">
        {/* AI Panel (Left) */}
        <div className="w-[400px] shrink-0 flex flex-col bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ease-in-out">
          <div className="flex h-12 items-center justify-between border-b border-slate-100 dark:border-white/5 px-4 shrink-0 bg-slate-50/50 dark:bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-500/10 flex items-center justify-center text-sky-600 dark:text-sky-400">
                <Sparkles className="h-3 w-3" />
              </div>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">
                AI Team Assistant
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {aiPanelContent}
          </div>
        </div>

        {/* Preview Panel (Right) */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#121214] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-white/[0.02] pointer-events-none z-0" />
          <div className="flex-1 min-h-0 relative z-10 flex flex-col">
            <LivePreview projectId={projectId} isCreatorMode={true} />
          </div>
        </div>
      </main>

      {!tourCompleted && <SpotlightTour onComplete={onCompleteTour} />}
    </div>
  );
}
