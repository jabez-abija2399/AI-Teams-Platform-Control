'use client';

import { TopNav } from './layouts/top-nav';
import { ActivityBar } from './layouts/activity-bar';
import { SidebarPanel } from './layouts/sidebar-panel';
import { EditorArea } from './layouts/editor-area';
import { AIPanel } from './layouts/ai-panel';
import { BottomPanel } from './layouts/bottom-panel';
import { StatusBar } from './layouts/status-bar';

interface WorkspaceShellProps {
  projectName: string;
  userName: string;
  sidebarContent: React.ReactNode;
  aiPanelContent: React.ReactNode;
}

export function WorkspaceShell({
  projectName,
  userName,
  sidebarContent,
  aiPanelContent,
}: WorkspaceShellProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
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
    </div>
  );
}
