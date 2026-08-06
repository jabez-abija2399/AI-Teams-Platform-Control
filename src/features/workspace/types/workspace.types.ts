export type ActivityId = 'explorer' | 'preview' | 'search' | 'ai-employees' | 'git' | 'github' | 'quality' | 'documentation' | 'deployment' | 'analytics' | 'extensions' | 'settings';

export interface ActivityItem {
  id: ActivityId;
  label: string;
  icon: string;
}

export type BottomPanelTab = 'terminal' | 'problems' | 'output' | 'logs' | 'tests' | 'preview' | 'review' | 'database' | 'performance' | 'workflow' | 'pipeline';

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
  /** Width of the side Preview split (px). 0 = closed. */
  previewPaneWidth: number;
  sidebarCollapsed: boolean;
  aiPanelCollapsed: boolean;
  bottomPanelCollapsed: boolean;
  /** Cursor-style editor | preview side-by-side */
  previewSplit: boolean;
}

export interface WorkspacePreferenceRecord {
  theme: 'light' | 'dark' | 'system';
  layout: WorkspaceLayoutPrefs;
}
