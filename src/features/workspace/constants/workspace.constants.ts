import type { ActivityItem, WorkspaceLayoutPrefs } from '../types/workspace.types';

export const ACTIVITY_ITEMS: ActivityItem[] = [
  { id: 'explorer', label: 'Explorer', icon: 'Files' },
  { id: 'preview', label: 'Live Preview', icon: 'Eye' },
  { id: 'search', label: 'Search', icon: 'Search' },
  { id: 'ai-employees', label: 'AI Employees', icon: 'Bot' },
  { id: 'git', label: 'Git', icon: 'GitBranch' },
  { id: 'github', label: 'GitHub', icon: 'GitPullRequest' },
  { id: 'quality', label: 'Quality', icon: 'ShieldCheck' },
  { id: 'documentation', label: 'Documentation', icon: 'BookOpen' },
  { id: 'deployment', label: 'Deployment', icon: 'Rocket' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3' },
  { id: 'extensions', label: 'Extensions', icon: 'Blocks' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
];

export const DEFAULT_LAYOUT: WorkspaceLayoutPrefs = {
  sidebarWidth: 268,
  aiPanelWidth: 320,
  bottomPanelHeight: 280,
  previewPaneWidth: 480,
  sidebarCollapsed: false,
  aiPanelCollapsed: true,
  bottomPanelCollapsed: true,
  previewSplit: true,
};

export const MIN_PANEL_WIDTH = 180;
export const MAX_SIDEBAR_WIDTH = 480;
export const MAX_AI_PANEL_WIDTH = 560;
