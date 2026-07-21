'use client';

import { GitBranch, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BranchManager } from './branch-manager';
import { CommitHistory } from './commit-history';
import { StatusIndicator } from './status-indicator';
import { useGitRepository } from '../hooks/use-git';

interface GitPanelProps {
  projectId: string;
}

export function GitPanel({ projectId }: GitPanelProps) {
  const { data: repository, isLoading } = useGitRepository(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Loading repository...
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
        <GitBranch className="h-8 w-8" />
        <p>No repository initialized</p>
        <p className="text-xs">Create a repository to start tracking changes</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-3 py-2">
        <StatusIndicator repositoryId={repository.id} />
      </div>

      <Tabs defaultValue="branches" className="flex-1 flex flex-col">
        <div className="border-b px-3">
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="branches">
              <GitBranch className="h-3.5 w-3.5" />
              Branches
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-3.5 w-3.5" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="branches" className="flex-1 overflow-y-auto p-2">
          <BranchManager repositoryId={repository.id} />
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-y-auto p-2">
          <CommitHistory repositoryId={repository.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
