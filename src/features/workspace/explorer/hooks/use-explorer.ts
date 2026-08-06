'use client';

import { useExplorerStore } from '../stores/explorer.store';
import { useCallback, useRef } from 'react';

async function fetchFolderContents(projectId: string, folderId: string | null) {
  const res = await fetch(
    `/api/projects/${projectId}/explorer?folderId=${folderId ?? ''}`,
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Explorer load failed');
  return json.data;
}

export function useExplorer(projectId: string) {
  const {
    boundProjectId,
    expandedFolders,
    loadedChildren,
    selectedNodeId,
    refreshTrigger,
    bindProject,
    toggleFolder,
    setChildren,
    selectNode,
  } = useExplorerStore();

  const rootRequestRef = useRef(0);

  const expandFolder = useCallback(
    async (folderId: string) => {
      if (!projectId) return;
      bindProject(projectId);
      const state = useExplorerStore.getState();
      const alreadyLoaded =
        state.boundProjectId === projectId && Boolean(state.loadedChildren[folderId]);
      toggleFolder(folderId);
      if (!alreadyLoaded) {
        const children = await fetchFolderContents(projectId, folderId);
        setChildren(projectId, folderId, children);
      }
    },
    [projectId, bindProject, toggleFolder, setChildren],
  );

  const loadRoot = useCallback(async () => {
    if (!projectId || projectId === 'undefined' || projectId === 'null') return;
    bindProject(projectId);
    const requestId = ++rootRequestRef.current;
    const children = await fetchFolderContents(projectId, null);
    // Drop stale responses after project switch / rapid refresh
    if (requestId !== rootRequestRef.current) return;
    if (useExplorerStore.getState().boundProjectId !== projectId) return;
    setChildren(projectId, 'root', children);
  }, [projectId, bindProject, setChildren]);

  return {
    boundProjectId,
    expandedFolders,
    loadedChildren: boundProjectId === projectId ? loadedChildren : {},
    selectedNodeId,
    refreshTrigger,
    expandFolder,
    loadRoot,
    selectNode,
    bindProject,
  };
}
