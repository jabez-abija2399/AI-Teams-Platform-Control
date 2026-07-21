'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { FileText, Trash2, Clock } from 'lucide-react';
import { useDocuments, useDeleteDocument } from '../hooks/use-documents';
import type { DocPage } from '../types';

const TYPE_STYLES: Record<string, string> = {
  guide: 'bg-blue-100 text-blue-800',
  api: 'bg-green-100 text-green-800',
  architecture: 'bg-purple-100 text-purple-800',
  readme: 'bg-orange-100 text-orange-800',
  specification: 'bg-cyan-100 text-cyan-800',
  changelog: 'bg-yellow-100 text-yellow-800',
};

function DocRow({
  doc,
  onSelect,
  onDelete,
}: {
  doc: DocPage;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <button
      className="hover:bg-muted/50 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors"
      onClick={onSelect}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{doc.title}</p>
          <div className="mt-0.5 flex items-center gap-2">
            <Badge className={TYPE_STYLES[doc.type] ?? 'bg-gray-100 text-gray-800'}>
              {doc.type}
            </Badge>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />v{doc.version}
            </span>
            <span className="text-muted-foreground text-xs">
              {new Date(doc.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete document"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </button>
  );
}

export function DocList({
  projectId,
  onSelectDoc,
}: {
  projectId: string;
  onSelectDoc: (docId: string) => void;
}) {
  const { data: documents, isLoading } = useDocuments(projectId);
  const deleteMutation = useDeleteDocument(projectId);

  if (isLoading) return <Loading label="Loading documents..." />;

  const items = documents ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">All Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents"
            description="Create a document to get started."
          />
        ) : (
          <div className="space-y-2">
            {items.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                onSelect={() => onSelectDoc(doc.id)}
                onDelete={() => deleteMutation.mutate(doc.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
