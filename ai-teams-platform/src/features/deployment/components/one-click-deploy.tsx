'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/components/ui/toast';
import { Rocket, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

interface DeployResult {
  deployment: {
    id: string;
    status: string;
    environmentName: string;
    provider: string;
  };
  environment: string;
}

export function OneClickDeploy({ projectId }: { projectId: string }) {
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<DeployResult | null>(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  async function handleDeploy() {
    setDeploying(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'vercel' }),
      });
      const json = await res.json();

      if (json.success) {
        setResult(json.data);
        addToast({
          type: 'success',
          title: 'Deployed successfully!',
          description: `Live on ${json.data.environment} via ${json.data.deployment.provider}`,
        });
        queryClient.invalidateQueries({ queryKey: ['deployments', projectId] });
      } else {
        addToast({
          type: 'error',
          title: 'Deployment failed',
          description: json.error?.message || 'Unknown error',
        });
      }
    } catch {
      addToast({
        type: 'error',
        title: 'Deployment failed',
        description: 'Network error. Please try again.',
      });
    } finally {
      setDeploying(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-sm font-medium text-green-800">Deployed!</p>
            <p className="text-xs text-green-600">
              {result.environment} • {result.deployment.provider}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setResult(null)}>
            Deploy Again
          </Button>
          <Button size="sm" variant="ghost">
            <ExternalLink className="h-3.5 w-3.5" />
            View Live
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Quick Deploy</p>
          <p className="text-xs text-muted-foreground">Deploy to Vercel in one click</p>
        </div>
        <Button onClick={handleDeploy} disabled={deploying} size="sm">
          {deploying ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket className="h-3.5 w-3.5" />
              Deploy Now
            </>
          )}
        </Button>
      </div>
      {deploying && (
        <div className="mt-3 space-y-1.5">
          {['Installing dependencies', 'Building project', 'Running tests', 'Deploying to production'].map(
            (step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{step}</span>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
