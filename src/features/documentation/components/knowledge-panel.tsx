'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Search, Trash2, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { useKnowledgeList, useKnowledgeSearch, useDeleteKnowledge } from '../hooks/use-knowledge';
import type { KnowledgeEntry } from '../types';

function KnowledgeItem({ entry, onDelete }: { entry: KnowledgeEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const preview = entry.content.length > 120 ? entry.content.slice(0, 120) + '...' : entry.content;

  return (
    <div className="space-y-1 rounded-lg border px-3 py-2">
      <div className="flex items-center justify-between">
        <button
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-medium"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="text-muted-foreground h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="text-muted-foreground h-3 w-3 shrink-0" />
          )}
          <span className="truncate">{entry.source}</span>
          <span className="text-muted-foreground ml-1 shrink-0 text-xs">
            {new Date(entry.createdAt).toLocaleDateString()}
          </span>
        </button>
        <Button variant="ghost" size="icon-xs" onClick={onDelete} title="Delete knowledge item">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-muted-foreground pl-4 text-xs">{expanded ? entry.content : preview}</p>
    </div>
  );
}

export function KnowledgePanel({ projectId }: { projectId: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allKnowledge, isLoading: isLoadingAll } = useKnowledgeList(projectId);
  const { data: searchResults, isLoading: isSearching } = useKnowledgeSearch(
    projectId,
    searchQuery,
  );
  const deleteMutation = useDeleteKnowledge(projectId);

  const isSearchingMode = searchQuery.length > 0;
  const items = isSearchingMode ? (searchResults ?? []) : (allKnowledge ?? []);
  const isLoading = isSearchingMode ? isSearching : isLoadingAll;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <BookOpen className="h-4 w-4" />
          Knowledge Base
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            placeholder="Search knowledge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>

        {isLoading ? (
          <Loading label="Searching..." />
        ) : items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={isSearchingMode ? 'No results found' : 'No knowledge entries'}
            description={
              isSearchingMode
                ? 'Try a different search query.'
                : 'Knowledge entries will appear here.'
            }
          />
        ) : (
          <div className="space-y-2">
            {items.map((entry) => (
              <KnowledgeItem
                key={entry.id}
                entry={entry}
                onDelete={() => deleteMutation.mutate(entry.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
