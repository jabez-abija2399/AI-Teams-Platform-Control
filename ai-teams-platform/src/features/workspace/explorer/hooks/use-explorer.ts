'use client';

import { useExplorerStore } from '../stores/explorer.store';
import { useCallback } from 'react';

async function fetchFolderContents(projectId: string, folderId: string | null) {
  const res = await fetch(
    `/api/projects/${projectId}/explorer?folderId=${folderId ?? ''}`,
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function useExplorer(projectId: string) {
  const {
    expandedFolders,
    loadedChildren,
    selectedNodeId,
    refreshTrigger,
    toggleFolder,
    setChildren,
    selectNode,
  } = useExplorerStore();

  const expandFolder = useCallback(
    async (folderId: string) => {
      const alreadyLoaded = loadedChildren[folderId];
      toggleFolder(folderId);
      if (!alreadyLoaded) {
        const children = await fetchFolderContents(projectId, folderId);
        setChildren(folderId, children);
      }
    },
    [projectId, loadedChildren, toggleFolder, setChildren],
  );

  const loadRoot = useCallback(async () => {
    const children = await fetchFolderContents(projectId, null);
    setChildren('root', children);
  }, [projectId, setChildren]);

  return {
    expandedFolders,
    loadedChildren,
    selectedNodeId,
    refreshTrigger,
    expandFolder,
    loadRoot,
    selectNode,
  };
}
