'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useEnvironments } from '@/features/deployment/hooks/use-environments';
import { useCreateDeployment } from '@/features/deployment/hooks/use-deployments';
import { Plus, X, Rocket } from 'lucide-react';
import type { DeployInput } from '@/features/deployment/types';

interface DeployDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROVIDER_OPTIONS = [
  'AWS',
  'GCP',
  'Azure',
  'Vercel',
  'Netlify',
  'Docker',
  'Kubernetes',
  'Custom',
];

export function DeployDialog({ projectId, open, onOpenChange }: DeployDialogProps) {
  const { data: environments } = useEnvironments(projectId);
  const createMutation = useCreateDeployment();

  const [environmentId, setEnvironmentId] = useState('');
  const [provider, setProvider] = useState('');
  const [stepNames, setStepNames] = useState<string[]>(['']);
  const [customProvider, setCustomProvider] = useState('');

  const resetForm = () => {
    setEnvironmentId('');
    setProvider('');
    setStepNames(['']);
    setCustomProvider('');
  };

  const addStep = () => {
    setStepNames([...stepNames, '']);
  };

  const removeStep = (index: number) => {
    if (stepNames.length <= 1) return;
    setStepNames(stepNames.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...stepNames];
    updated[index] = value;
    setStepNames(updated);
  };

  const effectiveProvider = provider === 'Custom' ? customProvider : provider;
  const steps = stepNames
    .filter((name) => name.trim() !== '')
    .map((name) => ({ name: name.trim() }));

  const isValid =
    environmentId &&
    effectiveProvider.trim() !== '' &&
    steps.length > 0;

  const handleSubmit = async () => {
    const input: DeployInput = {
      projectId,
      environmentId,
      provider: effectiveProvider.trim(),
      steps,
    };
    await createMutation.mutateAsync(input);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Deployment</DialogTitle>
          <DialogDescription>Configure and launch a new deployment.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-foreground text-xs font-medium">Environment</label>
            <select
              value={environmentId}
              onChange={(e) => setEnvironmentId(e.target.value)}
              className="border-input bg-background h-8 w-full rounded-lg border px-2.5 py-1 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="">Select environment</option>
              {(environments ?? []).map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-foreground text-xs font-medium">Provider</label>
            <div className="flex flex-wrap gap-1.5">
              {PROVIDER_OPTIONS.map((p) => (
                <Badge
                  key={p}
                  className={`cursor-pointer ${
                    provider === p
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                  onClick={() => setProvider(p)}
                >
                  {p}
                </Badge>
              ))}
            </div>
            {provider === 'Custom' && (
              <Input
                placeholder="Custom provider name"
                value={customProvider}
                onChange={(e) => setCustomProvider(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-foreground text-xs font-medium">Steps</label>
              <Button variant="ghost" size="xs" onClick={addStep}>
                <Plus className="h-3 w-3" />
                Add
              </Button>
            </div>
            <div className="space-y-1.5">
              {stepNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-muted-foreground w-5 text-center text-xs">{i + 1}.</span>
                  <Input
                    placeholder={`Step ${i + 1} name`}
                    value={name}
                    onChange={(e) => updateStep(i, e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeStep(i)}
                    disabled={stepNames.length <= 1}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createMutation.isPending}
          >
            <Rocket className="h-3 w-3" />
            {createMutation.isPending ? 'Creating...' : 'Deploy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
