'use client';

import dynamic from 'next/dynamic';
import { useWorkspaceStore } from '@/features/workspace/stores/workspace.store';

const AssistantChat = dynamic(
  () => import('@/features/code-assistant/components/assistant-chat').then((m) => ({ default: m.AssistantChat })),
  { ssr: false },
);

export function AssistantChatWrapper({ projectId }: { projectId: string }) {
  const { openTabs, activeTabId } = useWorkspaceStore();
  const activeTab = openTabs.find((t) => t.id === activeTabId);

  return (
    <AssistantChat
      projectId={projectId}
      context={
        activeTab
          ? {
              fileName: activeTab.path,
              language: '',
            }
          : undefined
      }
    />
  );
}
