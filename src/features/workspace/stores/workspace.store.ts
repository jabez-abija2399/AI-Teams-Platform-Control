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
  activeAgentTab: string;
  layout: WorkspaceLayoutPrefs;
  simpleMode: boolean;
  tourCompleted: boolean;

  setCurrentProject: (projectId: string | null) => void;
  openTab: (tab: OpenTab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string | null) => void;
  markTabDirty: (tabId: string, isDirty: boolean) => void;
  setActivity: (activity: ActivityId) => void;
  setActiveAgentTab: (tab: string) => void;
  setBottomPanel: (panel: BottomPanelTab) => void;
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  toggleBottomPanel: () => void;
  setSidebarWidth: (width: number) => void;
  setAIPanelWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
  setPreviewPaneWidth: (width: number) => void;
  setPreviewSplit: (open: boolean) => void;
  togglePreviewSplit: () => void;
  /** Focus Studio for post-pipeline: Explorer + Preview split, technical mode */
  enterStudioFocus: (opts?: { activity?: ActivityId; openDeploy?: boolean }) => void;
  toggleSimpleMode: () => void;
  setSimpleMode: (value: boolean) => void;
  completeTour: () => void;
}

function mergeLayout(partial: Partial<WorkspaceLayoutPrefs>): WorkspaceLayoutPrefs {
  return { ...DEFAULT_LAYOUT, ...partial };
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentProjectId: null,
      openTabs: [],
      activeTabId: null,
      selectedActivity: 'explorer',
      activeBottomPanel: 'preview',
      activeAgentTab: 'ceo',
      layout: DEFAULT_LAYOUT,
      simpleMode: false,
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
      setActiveAgentTab: (tab) => set({ activeAgentTab: tab }),
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
      setPreviewPaneWidth: (width) =>
        set((state) => ({ layout: { ...state.layout, previewPaneWidth: width } })),
      setPreviewSplit: (open) =>
        set((state) => ({ layout: { ...state.layout, previewSplit: open } })),
      togglePreviewSplit: () =>
        set((state) => ({
          layout: { ...state.layout, previewSplit: !state.layout.previewSplit },
        })),

      enterStudioFocus: (opts) =>
        set((state) => ({
          simpleMode: false,
          selectedActivity: opts?.openDeploy ? 'deployment' : opts?.activity ?? 'explorer',
          activeBottomPanel: 'preview',
          layout: {
            ...state.layout,
            previewSplit: !opts?.openDeploy,
            sidebarCollapsed: false,
            aiPanelCollapsed: true,
            bottomPanelCollapsed: true,
            previewPaneWidth: Math.max(state.layout.previewPaneWidth || 480, 420),
          },
        })),

      toggleSimpleMode: () =>
        set((state) => ({ simpleMode: !state.simpleMode })),
      setSimpleMode: (value) => set({ simpleMode: value }),
      completeTour: () =>
        set({ tourCompleted: true }),
    }),
    {
      name: 'workspace-layout',
      partialize: (state) => ({
        layout: state.layout,
        simpleMode: state.simpleMode,
        tourCompleted: state.tourCompleted,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<WorkspaceState> | undefined;
        return {
          ...current,
          ...p,
          layout: mergeLayout(p?.layout ?? {}),
        };
      },
    },
  ),
);
