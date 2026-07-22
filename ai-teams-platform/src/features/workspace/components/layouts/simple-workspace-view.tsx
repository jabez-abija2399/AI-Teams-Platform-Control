'use client';

import { useEffect, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopNav } from './top-nav';
import { ActivityBar } from './activity-bar';
import { SidebarPanel } from './sidebar-panel';
import { StatusBar } from './status-bar';
import { SimpleTechnicalToggle } from '@/features/onboarding/components/simple-technical-toggle';
import { SpotlightTour } from '@/features/onboarding/components/spotlight-tour';
import { LivePreviewStatic } from '@/features/workspace/preview/components/live-preview-static';
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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopNav projectName={projectName} userName={userName} />
      <div className="flex items-center justify-between border-b px-3 py-1">
        <ChangeHistoryDropdown projectId={projectId} />
        <div className="flex items-center gap-2">
          {isDesktop && (
            <SimpleTechnicalToggle isSimple={effectiveSimpleMode} onToggle={onToggleMode} />
          )}
          {effectiveSimpleMode && isDesktop && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={onToggleMode}
            >
              <Maximize2 className="h-3 w-3" /> Show full workspace
            </Button>
          )}
        </div>
      </div>
      {!isDesktop && (
        <p className="border-b bg-muted/30 px-3 py-1.5 text-center text-[11px] text-muted-foreground">
          The full workspace (code editor, terminal, file explorer) needs a larger screen.
        </p>
      )}
      {effectiveSimpleMode ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 divide-y overflow-hidden md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="min-h-0 overflow-y-auto">{sidebarContent}</div>
          <div className="min-h-0 overflow-hidden">
            <LivePreviewStatic projectId={projectId} />
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <ActivityBar />
          <SidebarPanel>{sidebarContent}</SidebarPanel>
          <div className="flex-1 overflow-y-auto">{aiPanelContent}</div>
        </div>
      )}
      <StatusBar />
      {!tourCompleted && <SpotlightTour onComplete={onCompleteTour} />}
    </div>
  );
}
