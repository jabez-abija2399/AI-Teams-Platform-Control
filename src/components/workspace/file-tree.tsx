'use client';

import React, { useState } from 'react';
import { FileCode, Folder, FolderOpen, ChevronRight, ChevronDown, FileText, Code2, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface FileTreeProps {
  files: Record<string, string>;
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  onNewFile?: (path: string) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: TreeNode[];
}

function buildTreeStructure(files: Record<string, string>): TreeNode[] {
  const root: TreeNode[] = [];

  Object.keys(files).forEach((filePath) => {
    const parts = filePath.split('/');
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFolder = index < parts.length - 1;
      const currentPath = parts.slice(0, index + 1).join('/');

      let existingNode = currentLevel.find((node) => node.name === part);

      if (!existingNode) {
        existingNode = {
          name: part,
          path: currentPath,
          isFolder,
          children: isFolder ? [] : undefined,
        };
        currentLevel.push(existingNode);
      }

      if (isFolder && existingNode.children) {
        currentLevel = existingNode.children;
      }
    });
  });

  return root;
}

export function FileTree({ files, activeFilePath, onSelectFile, onNewFile }: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    src: true,
  });

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const treeNodes = buildTreeStructure(files);

  const getFileIcon = (name: string) => {
    if (name.endsWith('.tsx') || name.endsWith('.jsx')) return <Code2 className="w-4 h-4 text-cyan-400" />;
    if (name.endsWith('.ts') || name.endsWith('.js')) return <FileCode className="w-4 h-4 text-blue-400" />;
    if (name.endsWith('.json')) return <FileText className="w-4 h-4 text-amber-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedFolders[node.path] ?? true;
    const isActive = activeFilePath === node.path;

    if (node.isFolder) {
      return (
        <div key={node.path}>
          <button
            onClick={() => toggleFolder(node.path)}
            className="w-full flex items-center gap-1.5 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800/80 rounded transition-colors"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-amber-400" />
            ) : (
              <Folder className="w-4 h-4 text-amber-400" />
            )}
            <span className="font-medium truncate">{node.name}</span>
          </button>
          {isExpanded && node.children && (
            <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    return (
      <button
        key={node.path}
        onClick={() => onSelectFile(node.path)}
        className={clsx(
          'w-full flex items-center gap-2 px-2 py-1 text-xs text-left rounded transition-colors',
          isActive
            ? 'bg-sky-600/30 text-sky-300 font-semibold border-l-2 border-sky-400'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        )}
        style={{ paddingLeft: `${depth * 12 + 20}px` }}
      >
        {getFileIcon(node.name)}
        <span className="truncate">{node.name}</span>
      </button>
    );
  };

  return (
    <div className="h-full bg-slate-950 border-r border-slate-800/80 flex flex-col select-none">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Explorer</span>
        {onNewFile && (
          <button
            onClick={() => {
              const name = prompt('Enter new file path (e.g. src/utils.ts):');
              if (name) onNewFile(name);
            }}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
            title="Create New File"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {treeNodes.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
