'use client';

import { useEffect, useState } from 'react';
import { TopNav } from './layouts/top-nav';
import { ActivityBar } from './layouts/activity-bar';
import { SidebarPanel } from './layouts/sidebar-panel';
import { EditorArea } from './layouts/editor-area';
import { AIPanel } from './layouts/ai-panel';
import { BottomPanel } from './layouts/bottom-panel';
import { StatusBar } from './layouts/status-bar';
import { SimpleWorkspaceView } from './layouts/simple-workspace-view';
import { SpotlightTour } from '@/features/onboarding/components/spotlight-tour';
import { useWorkspaceStore } from '../stores/workspace.store';

interface WorkspaceShellProps {
  projectName: string;
  userName: string;
  projectId: string;
  sidebarContent: React.ReactNode;
  aiPanelContent: React.ReactNode;
}

export function WorkspaceShell({
  projectName,
  userName,
  projectId,
  sidebarContent,
  aiPanelContent,
}: WorkspaceShellProps) {
  const { simpleMode, tourCompleted, toggleSimpleMode, completeTour } = useWorkspaceStore();
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const effectiveSimpleMode = simpleMode || !isDesktop;

  if (effectiveSimpleMode) {
    return (
      <SimpleWorkspaceView
        projectName={projectName}
        userName={userName}
        projectId={projectId}
        sidebarContent={sidebarContent}
        aiPanelContent={aiPanelContent}
        simpleMode={simpleMode}
        onToggleMode={toggleSimpleMode}
        tourCompleted={tourCompleted}
        onCompleteTour={completeTour}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden" data-tour="workspace">
      <TopNav projectName={projectName} userName={userName} />
      <div className="flex items-center justify-between border-b px-3 py-1.5 bg-muted/20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">Developer Mode Active</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSimpleMode}
            className="px-3 py-1 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            Switch to Creator Mode
          </button>
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
      {!tourCompleted && <SpotlightTour onComplete={completeTour} />}
    </div>
  );
}
