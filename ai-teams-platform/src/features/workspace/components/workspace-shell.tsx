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
