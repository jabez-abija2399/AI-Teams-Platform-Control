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
const MarketplaceBrowse = dynamic(
  () => import('@/features/marketplace/components/marketplace-browse').then((m) => ({ default: m.MarketplaceBrowse })),
  { ssr: false },
);
const GitHubIntegration = dynamic(
  () => import('@/features/git-integration/components/github-integration').then((m) => ({ default: m.GitHubIntegration })),
  { ssr: false },
);
const AgentTeamOverview = dynamic(
  () => import('@/features/workspace/ai-employees/components/agent-team-overview').then((m) => ({ default: m.AgentTeamOverview })),
  { ssr: false },
);
const LivePreview = dynamic(
  () => import('@/features/workspace/preview/components/live-preview').then((m) => ({ default: m.LivePreview })),
  { ssr: false },
);

import { useState } from 'react';
import { Search, FolderKanban, Sparkles } from 'lucide-react';

export function WorkspaceSidebarContent() {
  const { selectedActivity, currentProjectId } = useWorkspaceStore();

  switch (selectedActivity) {
    case 'explorer':
      return currentProjectId ? <ExplorerTree projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'preview':
      return currentProjectId ? <LivePreview projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'git':
      return currentProjectId ? <GitPanel projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'github':
      return currentProjectId ? <GitHubIntegration projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'quality':
      return currentProjectId ? <QualityPanel projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'documentation':
      return currentProjectId ? <DocumentationPanel projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'deployment':
      return currentProjectId ? <DeploymentPanel projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'analytics':
      return currentProjectId ? <AnalyticsPanel projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'search':
      return <SearchSidebarPanel />;
    case 'ai-employees':
      return currentProjectId ? <AgentTeamOverview projectId={currentProjectId} /> : <Placeholder label="Select a project" />;
    case 'extensions':
      return <MarketplaceBrowse />;
    case 'settings':
      return <SettingsSidebarPanel />;
    default:
      return <Placeholder label="Workspace Panel" />;
  }
}

function SettingsSidebarPanel() {
  return (
    <div className="p-3 space-y-4 font-sans text-xs text-foreground">
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">Editor Theme</label>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 bg-secondary border border-border text-foreground rounded text-xs font-medium">Auto (System)</button>
          <button className="px-3 py-1.5 bg-background border border-input text-muted-foreground rounded text-xs font-medium hover:text-foreground">Light</button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">Tab Size</label>
        <select className="w-full bg-background border border-input rounded px-2.5 py-1 text-xs text-foreground">
          <option value="2">2 Spaces</option>
          <option value="4">4 Spaces</option>
        </select>
      </div>

      <div className="space-y-2 pt-2 border-t border-border">
        <label className="flex items-center justify-between text-xs text-foreground cursor-pointer">
          <span>Minimap</span>
          <input type="checkbox" defaultChecked className="rounded border-input bg-background text-sky-600" />
        </label>
        <label className="flex items-center justify-between text-xs text-foreground cursor-pointer">
          <span>Word Wrap</span>
          <input type="checkbox" defaultChecked className="rounded border-input bg-background text-sky-600" />
        </label>
      </div>
    </div>
  );
}

function SearchSidebarPanel() {
  const [query, setQuery] = useState('');
  return (
    <div className="p-3 space-y-3 font-sans">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files & symbols..."
          className="w-full pl-8 pr-3 py-1.5 bg-background border border-input rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-sky-500"
        />
      </div>
      <div className="text-[11px] text-muted-foreground italic px-1">
        {query ? `Searching for "${query}" across workspace...` : 'Type to search codebase symbols and AST nodes.'}
      </div>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
      <Sparkles className="h-8 w-8 mb-2 text-sky-600/50 dark:text-sky-400/50 animate-pulse" />
      <span className="text-xs font-semibold text-foreground mb-1">{label}</span>
      <span className="text-[11px] opacity-80">Select a project file or activity item to view details.</span>
    </div>
  );
}
