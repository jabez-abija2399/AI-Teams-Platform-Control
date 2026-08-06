'use client';

import { useEffect, useState } from 'react';
import { TopNav } from './layouts/top-nav';
import { ActivityBar } from './layouts/activity-bar';
import { SidebarPanel } from './layouts/sidebar-panel';
import { EditorArea } from './layouts/editor-area';
import { AIPanel } from './layouts/ai-panel';
import { BottomPanel } from './layouts/bottom-panel';
import { StatusBar } from './layouts/status-bar';
import { StudioPreviewPane } from './layouts/studio-preview-pane';
import { SimpleWorkspaceView } from './layouts/simple-workspace-view';
import { SpotlightTour } from '@/features/onboarding/components/spotlight-tour';
import { useWorkspaceStore } from '../stores/workspace.store';

interface WorkspaceShellProps {
  projectName: string;
  userName: string;
  projectId: string;
  sidebarContent: React.ReactNode;
  aiPanelContent: React.ReactNode;
  /** Prefer technical IDE chrome (Studio after Complete). */
  forceTechnical?: boolean;
  onBackToMission?: () => void;
}

export function WorkspaceShell({
  projectName,
  userName,
  projectId,
  sidebarContent,
  aiPanelContent,
  forceTechnical = false,
  onBackToMission,
}: WorkspaceShellProps) {
  const {
    simpleMode,
    tourCompleted,
    toggleSimpleMode,
    completeTour,
    setCurrentProject,
    setSimpleMode,
  } = useWorkspaceStore();
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    setCurrentProject(projectId);
  }, [projectId, setCurrentProject]);

  useEffect(() => {
    if (forceTechnical) setSimpleMode(false);
  }, [forceTechnical, setSimpleMode]);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const effectiveSimpleMode = forceTechnical
    ? false
    : simpleMode || !isDesktop;

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
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden bg-background"
      data-tour="workspace"
      data-studio="shell"
    >
      <TopNav
        projectName={projectName}
        userName={userName}
        onBackToMission={onBackToMission}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ActivityBar />
        <SidebarPanel>{sidebarContent}</SidebarPanel>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <EditorArea />
          <BottomPanel />
        </div>
        <StudioPreviewPane projectId={projectId} />
        <AIPanel>{aiPanelContent}</AIPanel>
      </div>
      <StatusBar />
      {!tourCompleted && <SpotlightTour onComplete={completeTour} />}
    </div>
  );
}
