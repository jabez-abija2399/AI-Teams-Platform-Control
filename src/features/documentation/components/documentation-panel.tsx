'use client';

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocTree } from './doc-tree';
import { DocEditor } from './doc-editor';
import { DocList } from './doc-list';
import { KnowledgePanel } from './knowledge-panel';
import { EmptyStateAction } from '@/features/onboarding/components/empty-state-action';
import {
  useDocuments,
  useDocument,
  useCreateDocument,
  useUpdateDocument,
} from '../hooks/use-documents';
import { TreePine, List, BookOpen, FileText } from 'lucide-react';

export function DocumentationPanel({ projectId }: { projectId: string }) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const { data: documents } = useDocuments(projectId);
  const { data: activeDoc } = useDocument(selectedDocId ?? '');
  const createMutation = useCreateDocument(projectId);
  const updateMutation = useUpdateDocument(projectId, selectedDocId ?? '');

  const handleCreateDoc = useCallback(
    (type: string) => {
      createMutation.mutate(
        { type, title: `New ${type} document`, content: '' },
        {
          onSuccess: (doc) => {
            setSelectedDocId(doc.id);
          },
        },
      );
    },
    [createMutation],
  );

  const handleUpdateDoc = useCallback(
    (input: { title?: string; content?: string }) => {
      if (!selectedDocId) return;
      updateMutation.mutate(input);
    },
    [selectedDocId, updateMutation],
  );

  return (
    <div className="flex h-full flex-col">
      {selectedDocId && activeDoc ? (
        <div className="flex h-full flex-col">
          <div className="flex items-center border-b px-3 py-1.5">
            <button
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
              onClick={() => setSelectedDocId(null)}
            >
              Back to list
            </button>
            <span className="text-muted-foreground mx-1.5 text-xs">/</span>
            <span className="truncate text-xs font-medium">{activeDoc.title}</span>
          </div>
          <div className="min-h-0 flex-1">
            <DocEditor
              document={activeDoc}
              onUpdate={handleUpdateDoc}
              isSaving={updateMutation.isPending}
            />
          </div>
        </div>
      ) : (
        <Tabs defaultValue="tree" className="flex h-full flex-col">
          <TabsList variant="line" className="w-full justify-start px-4">
            <TabsTrigger value="tree">
              <TreePine className="h-4 w-4" />
              Tree
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="knowledge">
              <BookOpen className="h-4 w-4" />
              Knowledge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tree" className="flex-1 overflow-auto">
            {(documents ?? []).length === 0 ? (
              <EmptyStateAction
                icon={FileText}
                title="No documentation yet"
                description="Create your first document to start building project knowledge."
                agentRole="DOCUMENTATION"
                actions={[
                  { label: 'Create Document', onClick: () => handleCreateDoc('guide') },
                ]}
              />
            ) : (
              <DocTree
                documents={documents ?? []}
                selectedDocId={selectedDocId}
                onSelectDoc={setSelectedDocId}
                onCreateDoc={handleCreateDoc}
              />
            )}
          </TabsContent>

          <TabsContent value="list" className="flex-1 overflow-auto p-4">
            <DocList projectId={projectId} onSelectDoc={setSelectedDocId} />
          </TabsContent>

          <TabsContent value="knowledge" className="flex-1 overflow-auto p-4">
            <KnowledgePanel projectId={projectId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
