'use client';

import dynamic from 'next/dynamic';
import { useWorkspaceStore } from '../stores/workspace.store';

const ExplorerTree = dynamic(
  () => import('@/features/workspace/explorer/components/explorer-tree').then((m) => ({ default: m.ExplorerTree })),
  { ssr: false },
);
const GitPanel = dynamic(
  () => import('@/features/git/components/git-panel').then((m) => ({ default: m.GitPanel })),
  { ssr: false },
);
const QualityPanel = dynamic(
  () => import('@/features/quality-engine/components/quality-panel').then((m) => ({ default: m.QualityPanel })),
  { ssr: false },
);
const DocumentationPanel = dynamic(
  () => import('@/features/documentation/components/documentation-panel').then((m) => ({ default: m.DocumentationPanel })),
  { ssr: false },
);
const DeploymentPanel = dynamic(
  () => import('@/features/deployment/components/deployment-panel').then((m) => ({ default: m.DeploymentPanel })),
  { ssr: false },
);
const AnalyticsPanel = dynamic(
  () => import('@/features/analytics/components/analytics-panel').then((m) => ({ default: m.AnalyticsPanel })),
  { ssr: false },
);

export function WorkspaceSidebarContent() {
  const { selectedActivity, currentProjectId } = useWorkspaceStore();

  switch (selectedActivity) {
    case 'explorer':
      return currentProjectId ? <ExplorerTree projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'git':
      return currentProjectId ? <GitPanel projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'quality':
      return currentProjectId ? <QualityPanel projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'documentation':
      return currentProjectId ? <DocumentationPanel projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'deployment':
      return currentProjectId ? <DeploymentPanel projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'analytics':
      return currentProjectId ? <AnalyticsPanel projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'search':
      return <Placeholder label="Search" />;
    case 'ai-employees':
      return <Placeholder label="AI Employees" />;
    case 'projects':
      return <Placeholder label="Projects" />;
    default:
      return <Placeholder label="Coming soon" />;
  }
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
      {label}
    </div>
  );
}
