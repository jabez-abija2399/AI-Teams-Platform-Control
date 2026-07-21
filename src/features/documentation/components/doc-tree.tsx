'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ChevronRight, ChevronDown, FileText, Plus, BookOpen, FileCode, File } from 'lucide-react';
import type { DocPage, DocTreeNode } from '../types';

interface DocTreeProps {
  documents: DocPage[];
  selectedDocId: string | null;
  onSelectDoc: (docId: string) => void;
  onCreateDoc: (type: string) => void;
}

const TYPE_ICONS: Record<string, typeof FileText> = {
  guide: BookOpen,
  api: FileCode,
  architecture: FileCode,
  readme: File,
};

function groupByType(documents: DocPage[]): DocTreeNode[] {
  const groups = new Map<string, DocPage[]>();
  for (const doc of documents) {
    const type = doc.type || 'uncategorized';
    const existing = groups.get(type);
    if (existing) {
      existing.push(doc);
    } else {
      groups.set(type, [doc]);
    }
  }

  return Array.from(groups.entries()).map(([type, docs]) => ({
    id: `group-${type}`,
    title: type,
    type: 'group',
    children: docs.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      children: [],
    })),
  }));
}

function TreeNode({
  node,
  selectedDocId,
  onSelectDoc,
  level = 0,
}: {
  node: DocTreeNode;
  selectedDocId: string | null;
  onSelectDoc: (docId: string) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const isGroup = node.children.length > 0 && node.id.startsWith('group-');
  const Icon = TYPE_ICONS[node.type] ?? FileText;

  return (
    <div>
      <button
        className={`hover:bg-muted flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm transition-colors ${
          !isGroup && node.id === selectedDocId ? 'bg-muted font-medium' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (isGroup) {
            setExpanded(!expanded);
          } else {
            onSelectDoc(node.id);
          }
        }}
      >
        {isGroup ? (
          expanded ? (
            <ChevronDown className="text-muted-foreground h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="text-muted-foreground h-3 w-3 shrink-0" />
          )
        ) : (
          <Icon className="text-muted-foreground h-3 w-3 shrink-0" />
        )}
        <span className="truncate">{node.title}</span>
        {isGroup && (
          <span className="text-muted-foreground ml-auto text-xs">{node.children.length}</span>
        )}
      </button>
      {isGroup && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              selectedDocId={selectedDocId}
              onSelectDoc={onSelectDoc}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocTree({ documents, selectedDocId, onSelectDoc, onCreateDoc }: DocTreeProps) {
  const treeNodes = groupByType(documents);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
          Documents
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onCreateDoc('guide')}
          title="New document"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {treeNodes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents"
          description="Create your first document to get started."
          action={{ label: 'New Document', onClick: () => onCreateDoc('guide') }}
        />
      ) : (
        <div className="space-y-0.5 pb-2">
          {treeNodes.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              selectedDocId={selectedDocId}
              onSelectDoc={onSelectDoc}
            />
          ))}
        </div>
      )}
    </div>
  );
}
