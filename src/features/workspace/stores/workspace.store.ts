import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityId, BottomPanelTab, OpenTab, WorkspaceLayoutPrefs } from '../types/workspace.types';
import { DEFAULT_LAYOUT } from '../constants/workspace.constants';

interface WorkspaceState {
  currentProjectId: string | null;
  openTabs: OpenTab[];
  activeTabId: string | null;
  selectedActivity: ActivityId;
  activeBottomPanel: BottomPanelTab;
  layout: WorkspaceLayoutPrefs;
  simpleMode: boolean;
  tourCompleted: boolean;

  setCurrentProject: (projectId: string | null) => void;
  openTab: (tab: OpenTab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string | null) => void;
  markTabDirty: (tabId: string, isDirty: boolean) => void;
  setActivity: (activity: ActivityId) => void;
  setBottomPanel: (panel: BottomPanelTab) => void;
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  toggleBottomPanel: () => void;
  setSidebarWidth: (width: number) => void;
  setAIPanelWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
  toggleSimpleMode: () => void;
  completeTour: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentProjectId: null,
      openTabs: [],
      activeTabId: null,
      selectedActivity: 'explorer',
      activeBottomPanel: 'terminal',
      layout: DEFAULT_LAYOUT,
      simpleMode: true,
      tourCompleted: false,

      setCurrentProject: (projectId) =>
        set({ currentProjectId: projectId, openTabs: [], activeTabId: null }),

      openTab: (tab) =>
        set((state) => {
          const existing = state.openTabs.find((t) => t.path === tab.path);
          if (existing) return { activeTabId: existing.id };
          return { openTabs: [...state.openTabs, tab], activeTabId: tab.id };
        }),

      closeTab: (tabId) =>
        set((state) => {
          const remaining = state.openTabs.filter((t) => t.id !== tabId);
          const wasActive = state.activeTabId === tabId;
          return {
            openTabs: remaining,
            activeTabId: wasActive ? (remaining.at(-1)?.id ?? null) : state.activeTabId,
          };
        }),

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      markTabDirty: (tabId, isDirty) =>
        set((state) => ({
          openTabs: state.openTabs.map((t) => (t.id === tabId ? { ...t, isDirty } : t)),
        })),

      setActivity: (activity) => set({ selectedActivity: activity }),
      setBottomPanel: (panel) => set({ activeBottomPanel: panel }),

      toggleSidebar: () =>
        set((state) => ({
          layout: { ...state.layout, sidebarCollapsed: !state.layout.sidebarCollapsed },
        })),
      toggleAIPanel: () =>
        set((state) => ({
          layout: { ...state.layout, aiPanelCollapsed: !state.layout.aiPanelCollapsed },
        })),
      toggleBottomPanel: () =>
        set((state) => ({
          layout: { ...state.layout, bottomPanelCollapsed: !state.layout.bottomPanelCollapsed },
        })),

      setSidebarWidth: (width) =>
        set((state) => ({ layout: { ...state.layout, sidebarWidth: width } })),
      setAIPanelWidth: (width) =>
        set((state) => ({ layout: { ...state.layout, aiPanelWidth: width } })),
      setBottomPanelHeight: (height) =>
        set((state) => ({ layout: { ...state.layout, bottomPanelHeight: height } })),

      toggleSimpleMode: () =>
        set((state) => ({ simpleMode: !state.simpleMode })),
      completeTour: () =>
        set({ tourCompleted: true }),
    }),
    { name: 'workspace-layout', partialize: (state) => ({ layout: state.layout, simpleMode: state.simpleMode, tourCompleted: state.tourCompleted }) },
  ),
);
