'use client';

import dynamic from 'next/dynamic';

const AgentPanel = dynamic(
  () => import('@/features/workspace/components/agent-panel').then((m) => ({ default: m.AgentPanel })),
  { ssr: false },
);

export function AssistantChatWrapper({ projectId }: { projectId: string }) {
  return <AgentPanel projectId={projectId} />;
}
