'use client';

import { useState } from 'react';
import { GitBranch, Plus, Trash2, GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  useGitBranches,
  useCreateBranch,
  useDeleteBranch,
  useSwitchBranch,
} from '../hooks/use-git';
import type { GitBranchInfo } from '../types';

const BRANCH_TYPE_COLORS: Record<string, string> = {
  FEATURE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  HOTFIX: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  RELEASE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  BUGFIX: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  CUSTOM: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

interface BranchManagerProps {
  repositoryId: string;
}

export function BranchManager({ repositoryId }: BranchManagerProps) {
  const { data: branches = [], isLoading } = useGitBranches(repositoryId);
  const createBranch = useCreateBranch();
  const deleteBranch = useDeleteBranch(repositoryId);
  const switchBranch = useSwitchBranch(repositoryId);

  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchType, setNewBranchType] = useState('FEATURE');

  function handleCreateBranch() {
    if (!newBranchName.trim()) return;

    createBranch.mutate(
      { repositoryId, name: newBranchName.trim(), type: newBranchType },
      {
        onSuccess: () => {
          setNewBranchName('');
          setNewBranchType('FEATURE');
          setIsCreating(false);
        },
      },
    );
  }

  function handleDeleteBranch(branchId: string) {
    deleteBranch.mutate(branchId);
  }

  function handleSwitchBranch(branchId: string) {
    switchBranch.mutate(branchId);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
        <GitBranch className="h-4 w-4 animate-pulse" />
        Loading branches...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Branches
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setIsCreating(!isCreating)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {isCreating && (
        <div className="space-y-2 px-2">
          <select
            value={newBranchType}
            onChange={(e) => setNewBranchType(e.target.value)}
            className="h-8 w-full rounded-lg border bg-transparent px-2 text-sm"
          >
            <option value="FEATURE">Feature</option>
            <option value="HOTFIX">Hotfix</option>
            <option value="RELEASE">Release</option>
            <option value="BUGFIX">Bugfix</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <div className="flex gap-1">
            <Input
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="branch-name"
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateBranch();
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <Button
              size="xs"
              onClick={handleCreateBranch}
              disabled={createBranch.isPending || !newBranchName.trim()}
            >
              {createBranch.isPending ? '...' : 'Create'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-0.5">
        {branches.map((branch: GitBranchInfo) => (
          <div
            key={branch.id}
            className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
              branch.isCurrent
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-muted/50'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate font-medium">{branch.name}</span>
            <Badge
              className={`text-[10px] ${BRANCH_TYPE_COLORS[branch.type] ?? ''}`}
            >
              {branch.type}
            </Badge>
            {branch.isCurrent && (
              <Badge variant="secondary" className="text-[10px]">
                Current
              </Badge>
            )}
            {!branch.isCurrent && (
              <div className="hidden group-hover:flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleSwitchBranch(branch.id)}
                  disabled={switchBranch.isPending}
                  title="Switch to this branch"
                >
                  <GitMerge className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDeleteBranch(branch.id)}
                  disabled={deleteBranch.isPending}
                  title="Delete branch"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <p className="px-2 py-4 text-center text-xs text-muted-foreground">
          No branches yet
        </p>
      )}
    </div>
  );
}
