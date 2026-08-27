'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { WorkspaceShell } from '@/features/workspace/components/workspace-shell';
import { WorkspaceSidebarContent } from '@/features/workspace/components/workspace-sidebar-content';
import { AssistantChatWrapper } from '@/app/dashboard/projects/[id]/workspace/assistant-chat-wrapper';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';
import type { StudioOpenOptions } from '@/features/workspace/types/studio.types';
import { Loader2 } from 'lucide-react';

const CompanyWorkspace = dynamic(
  () =>
    import('@/features/workspace/components/company-workspace').then(
      (m) => m.CompanyWorkspace,
    ),
  { ssr: false },
);

export type WorkspaceViewMode = 'mission' | 'studio';

async function refreshStudioSurfaces() {
  try {
    const { useExplorerStore } = await import(
      '@/features/workspace/explorer/stores/explorer.store'
    );
    useExplorerStore.getState().triggerRefresh();
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('explorer-refresh'));
  window.dispatchEvent(new CustomEvent('studio-preview-reload'));
}

/**
 * Mission Control + Studio (editor / explorer / preview / deploy).
 * Studio always binds to this hub's projectId.
 */
export function ProjectWorkspaceHub({
  projectId,
  projectName,
  projectDescription,
  userName,
}: {
  projectId: string;
  projectName: string;
  projectDescription: string;
  userName: string;
}) {
  const [view, setView] = useState<WorkspaceViewMode>('mission');
  const [studioReady, setStudioReady] = useState(false);
  const [studioStatus, setStudioStatus] = useState('Opening Studio…');
  const enterStudioFocus = useWorkspaceStore((s) => s.enterStudioFocus);
  const setCurrentProject = useWorkspaceStore((s) => s.setCurrentProject);

  const openStudio = useCallback(
    (opts?: StudioOpenOptions) => {
      if (!projectId || projectId === 'undefined') return;

      setCurrentProject(projectId);
      if (opts?.agentTab) {
        useWorkspaceStore.getState().setActiveAgentTab(opts.agentTab);
      }
      enterStudioFocus({
        activity: opts?.focus === 'deploy' ? 'deployment' : 'explorer',
        openDeploy: opts?.focus === 'deploy',
      });
      if (opts?.focus === 'ai') {
        const currentLayout = useWorkspaceStore.getState().layout;
        if (currentLayout.aiPanelCollapsed) {
          useWorkspaceStore.getState().toggleAIPanel();
        }
      }
      setStudioReady(false);
      setStudioStatus('Loading project files…');
      setView('studio');

      void (async () => {
        try {
          setStudioStatus('Preparing Explorer & Preview…');
          const res = await fetch(`/api/projects/${projectId}/explorer/ensure`, {
            method: 'POST',
            credentials: 'same-origin',
          });
          const json = await res.json().catch(() => null);
          if (json?.data?.synced) {
            setStudioStatus(`Synced ${json.data.fileCount ?? ''} files`);
          } else {
            setStudioStatus('Files ready');
          }
        } catch {
          setStudioStatus('Opening with existing files…');
        } finally {
          await refreshStudioSurfaces();
          // Second refresh after short delay — Preview often races first ensure
          window.setTimeout(() => {
            void refreshStudioSurfaces();
            setStudioReady(true);
          }, 400);
        }
      })();
    },
    [projectId, enterStudioFocus, setCurrentProject],
  );

  if (view === 'studio') {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        {!studioReady && (
          <div className="flex shrink-0 items-center gap-2 border-b border-border/70 bg-primary/5 px-4 py-2 text-[11px] text-primary">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="font-medium">{studioStatus}</span>
            <span className="text-muted-foreground">· {projectName}</span>
          </div>
        )}
        <WorkspaceShell
          projectId={projectId}
          projectName={projectName}
          userName={userName}
          forceTechnical
          onBackToMission={() => {
            setView('mission');
            setStudioReady(false);
          }}
          sidebarContent={<WorkspaceSidebarContent projectId={projectId} />}
          aiPanelContent={<AssistantChatWrapper projectId={projectId} />}
        />
      </div>
    );
  }

  return (
    <CompanyWorkspace
      projectId={projectId}
      projectName={projectName}
      projectDescription={projectDescription}
      userName={userName}
      onOpenStudio={openStudio}
    />
  );
}
