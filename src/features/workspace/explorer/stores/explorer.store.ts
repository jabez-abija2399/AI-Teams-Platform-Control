import { create } from 'zustand';
import type { ExplorerNode } from '../types/explorer.types';

interface ExplorerState {
  /** Project this cache belongs to — never show another project's tree. */
  boundProjectId: string | null;
  expandedFolders: Set<string>;
  loadedChildren: Record<string, ExplorerNode[]>;
  selectedNodeId: string | null;
  refreshTrigger: number;

  /** Wipe cache and bind to a project (call on every project open/switch). */
  bindProject: (projectId: string) => void;
  toggleFolder: (folderId: string) => void;
  setChildren: (projectId: string, folderId: string, children: ExplorerNode[]) => void;
  selectNode: (nodeId: string | null) => void;
  isExpanded: (folderId: string) => boolean;
  triggerRefresh: () => void;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  boundProjectId: null,
  expandedFolders: new Set(),
  loadedChildren: {},
  selectedNodeId: null,
  refreshTrigger: 0,

  bindProject: (projectId) => {
    const current = get().boundProjectId;
    if (current === projectId) return;
    set({
      boundProjectId: projectId,
      expandedFolders: new Set(),
      loadedChildren: {},
      selectedNodeId: null,
    });
  },

  toggleFolder: (folderId) =>
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return { expandedFolders: next };
    }),

  setChildren: (projectId, folderId, children) => {
    // Ignore late responses from a previous project (race on switch)
    if (get().boundProjectId !== projectId) return;
    set((state) => ({
      loadedChildren: { ...state.loadedChildren, [folderId]: children },
    }));
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  isExpanded: (folderId) => get().expandedFolders.has(folderId),

  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
