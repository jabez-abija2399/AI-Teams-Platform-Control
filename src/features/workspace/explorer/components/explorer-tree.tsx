'use client';

import { memo, useEffect, useState, useRef } from 'react';
import { FolderNode } from './folder-node';
import { FileNode } from './file-node';
import { useExplorer } from '../hooks/use-explorer';
import { useExplorerStore } from '../stores/explorer.store';
import { useWorkspaceStore } from '../../stores/workspace.store';
import { Loader2 } from 'lucide-react';
import type { ExplorerNode } from '../types/explorer.types';

const TreeLevel = memo(function TreeLevel({
  projectId,
  folderKey,
  depth,
  refreshing,
}: {
  projectId: string;
  folderKey: string;
  depth: number;
  refreshing: boolean;
}) {
  const { loadedChildren, expandedFolders, expandFolder, selectedNodeId, selectNode } =
    useExplorer(projectId);
  const openTab = useWorkspaceStore((s) => s.openTab);
  const nodes = loadedChildren[folderKey] ?? [];

  return (
    <>
      {nodes.map((node: ExplorerNode) =>
        node.type === 'folder' ? (
          <div key={node.id}>
            <FolderNode
              node={node}
              depth={depth}
              expanded={expandedFolders.has(node.id)}
              onToggle={() => expandFolder(node.id)}
              onContextMenu={(e) => e.preventDefault()}
            />
            {expandedFolders.has(node.id) && (
              <TreeLevel
                projectId={projectId}
                folderKey={node.id}
                depth={depth + 1}
                refreshing={refreshing}
              />
            )}
          </div>
        ) : (
          <FileNode
            key={node.id}
            node={node}
            depth={depth}
            selected={selectedNodeId === node.id}
            onSelect={() => {
              selectNode(node.id);
              openTab({
                id: node.id,
                title: node.name,
                path: node.path,
                isDirty: false,
              });
            }}
            onContextMenu={(e) => e.preventDefault()}
          />
        ),
      )}
    </>
  );
});

export function ExplorerTree({ projectId }: { projectId: string }) {
  const { loadRoot, loadedChildren, refreshTrigger } = useExplorer(projectId);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshCountRef = useRef(0);
  const hasLoaded = useRef(false);

  useEffect(() => {
    setLoading(true);
    loadRoot().finally(() => setLoading(false));
  }, [projectId, loadRoot]);

  useEffect(() => {
    refreshCountRef.current++;
    if (refreshCountRef.current > 1) {
      setRefreshing(true);
      loadRoot().finally(() => setRefreshing(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  useEffect(() => {
    const onRefresh = () => {
      useExplorerStore.getState().triggerRefresh();
    };
    window.addEventListener('explorer-refresh', onRefresh);
    return () => window.removeEventListener('explorer-refresh', onRefresh);
  }, []);

  const rootNodes = loadedChildren['root'] ?? [];

  return (
    <div className="py-1">
      {(loading || refreshing) && (
        <div className="flex items-center gap-2 px-3 py-2 text-[10px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          {loading ? 'Loading files...' : 'Refreshing...'}
        </div>
      )}
      {!loading && rootNodes.length === 0 && (
        <div className="px-3 py-5 text-center">
          <p className="text-[11px] font-medium text-foreground">No files yet</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Opening Studio prepares files for this project. If this stays empty, finish Development
            on Mission Control or click Reload Preview.
          </p>
        </div>
      )}
      <TreeLevel projectId={projectId} folderKey="root" depth={0} refreshing={refreshing} />
    </div>
  );
}
