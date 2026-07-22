'use client';

import { useState } from 'react';
import {
  Link2,
  Unlink,
  GitPullRequest,
  Upload,
  Download,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
  Code2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/toast';
import type { GitIntegrationState, PRInfo } from '../types';

interface GitHubIntegrationProps {
  projectId: string;
}

export function GitHubIntegration({ projectId }: GitHubIntegrationProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [pushMessage, setPushMessage] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [prBody, setPrBody] = useState('');
  const [prHead, setPrHead] = useState('');
  const [showPRForm, setShowPRForm] = useState(false);

  const { data: integrationData, isLoading } = useQuery({
    queryKey: ['git-integration', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/git/connect?projectId=${projectId}`);
      return res.json() as Promise<{ success: boolean; data: GitIntegrationState | null }>;
    },
  });

  const integration = integrationData?.data;

  const connectMutation = useMutation({
    mutationFn: async () => {
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      if (!clientId) throw new Error('GitHub OAuth not configured');
      const redirectUri = `${window.location.origin}/api/git/callback?projectId=${projectId}`;
      const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
      window.location.href = url;
      return {};
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/git/connect?projectId=${projectId}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git-integration', projectId] });
      toast.addToast({ title: 'GitHub disconnected', type: 'success' });
    },
  });

  const pushMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: pushMessage }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.addToast({ title: `Pushed successfully! SHA: ${data.data.sha.slice(0, 7)}`, type: 'success' });
        setPushMessage('');
      } else {
        toast.addToast({ title: data.error?.message || 'Push failed', type: 'error' });
      }
    },
  });

  const pullMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/git/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.addToast({ title: `Pulled ${data.data.files} files`, type: 'success' });
        queryClient.invalidateQueries({ queryKey: ['workspace-files', projectId] });
      }
    },
  });

  const prMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/git/pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, title: prTitle, body: prBody, head: prHead }),
      });
      return res.json() as Promise<{ success: boolean; data: PRInfo }>;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.addToast({ title: `PR #${data.data.number} created`, type: 'success' });
        setShowPRForm(false);
        setPrTitle('');
        setPrBody('');
        setPrHead('');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!integration) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Code2 className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">Connect to GitHub</p>
        <p className="text-xs text-muted-foreground text-center max-w-[250px]">
          Push code, create PRs, and sync with GitHub repositories
        </p>
        <Button
          size="sm"
          onClick={() => connectMutation.mutate()}
          disabled={connectMutation.isPending}
        >
          <Code2 className="h-4 w-4 mr-2" />
          Connect GitHub
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4" />
          <span className="text-sm font-medium">{integration.githubUsername}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => disconnectMutation.mutate()}
        >
          <Unlink className="h-3.5 w-3.5" />
        </Button>
      </div>

      {integration.repoUrl && (
        <a
          href={integration.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-blue-500 hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          {integration.repoOwner}/{integration.repoName}
        </a>
      )}

      <div className="border-t pt-3 flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Push Changes</p>
        <Input
          placeholder="Commit message..."
          value={pushMessage}
          onChange={(e) => setPushMessage(e.target.value)}
          className="h-8 text-xs"
        />
        <Button
          size="sm"
          disabled={!pushMessage || pushMutation.isPending}
          onClick={() => pushMutation.mutate()}
        >
          {pushMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
          ) : (
            <Upload className="h-3.5 w-3.5 mr-2" />
          )}
          Push
        </Button>
      </div>

      <div className="border-t pt-3 flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Pull Changes</p>
        <Button
          size="sm"
          variant="outline"
          disabled={pullMutation.isPending}
          onClick={() => pullMutation.mutate()}
        >
          {pullMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
          ) : (
            <Download className="h-3.5 w-3.5 mr-2" />
          )}
          Pull
        </Button>
      </div>

      <div className="border-t pt-3 flex flex-col gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowPRForm(!showPRForm)}
        >
          <GitPullRequest className="h-3.5 w-3.5 mr-2" />
          Create Pull Request
        </Button>

        {showPRForm && (
          <div className="flex flex-col gap-2">
            <Input
              placeholder="PR title"
              value={prTitle}
              onChange={(e) => setPrTitle(e.target.value)}
              className="h-8 text-xs"
            />
            <textarea
              placeholder="Description..."
              value={prBody}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrBody(e.target.value)}
              className="text-xs min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <Input
              placeholder="Head branch"
              value={prHead}
              onChange={(e) => setPrHead(e.target.value)}
              className="h-8 text-xs"
            />
            <Button
              size="sm"
              disabled={!prTitle || !prHead || prMutation.isPending}
              onClick={() => prMutation.mutate()}
            >
              {prMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
              Create PR
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
