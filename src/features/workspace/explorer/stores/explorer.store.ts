import { create } from 'zustand';
import type { ExplorerNode } from '../types/explorer.types';

interface ExplorerState {
  expandedFolders: Set<string>;
  loadedChildren: Record<string, ExplorerNode[]>;
  selectedNodeId: string | null;
  refreshTrigger: number;

  toggleFolder: (folderId: string) => void;
  setChildren: (folderId: string, children: ExplorerNode[]) => void;
  selectNode: (nodeId: string | null) => void;
  isExpanded: (folderId: string) => boolean;
  triggerRefresh: () => void;
}

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  expandedFolders: new Set(),
  loadedChildren: {},
  selectedNodeId: null,
  refreshTrigger: 0,

  toggleFolder: (folderId) =>
    set((state) => {
      const next = new Set(state.expandedFolders);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return { expandedFolders: next };
    }),

  setChildren: (folderId, children) =>
    set((state) => ({
      loadedChildren: { ...state.loadedChildren, [folderId]: children },
    })),

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  isExpanded: (folderId) => get().expandedFolders.has(folderId),

  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));
