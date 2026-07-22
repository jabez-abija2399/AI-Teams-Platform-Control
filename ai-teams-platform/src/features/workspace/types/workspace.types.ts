export type ActivityId = 'explorer' | 'search' | 'ai-employees' | 'projects' | 'git' | 'quality' | 'documentation' | 'deployment' | 'analytics' | 'extensions' | 'settings';

export interface ActivityItem {
  id: ActivityId;
  label: string;
  icon: string;
}

export type BottomPanelTab = 'terminal' | 'problems' | 'output' | 'logs' | 'tests' | 'preview' | 'review';

export interface OpenTab {
  id: string;
  title: string;
  path: string;
  isDirty: boolean;
}

export interface WorkspaceLayoutPrefs {
  sidebarWidth: number;
  aiPanelWidth: number;
  bottomPanelHeight: number;
  sidebarCollapsed: boolean;
  aiPanelCollapsed: boolean;
  bottomPanelCollapsed: boolean;
}

export interface WorkspacePreferenceRecord {
  theme: 'light' | 'dark' | 'system';
  layout: WorkspaceLayoutPrefs;
}
