'use client';

import { useState } from 'react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { FolderTree, Plus, Pencil, Trash2, X } from 'lucide-react';
import {
  useEnvironments,
  useCreateEnvironment,
  useUpdateEnvironment,
  useDeleteEnvironment,
} from '@/features/deployment/hooks/use-environments';
import type { EnvironmentInfo } from '@/features/deployment/types';
import type { CreateEnvironmentInput } from '@/features/deployment/schemas/deployment.schema';

function KeyValueEditor({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const entries = Object.entries(value);

  const addEntry = () => {
    onChange({ ...value, '': '' });
  };

  const updateEntry = (oldKey: string, newKey: string, newValue: string) => {
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === oldKey) {
        if (newKey !== '') next[newKey] = newValue;
      } else {
        next[k] = v;
      }
    }
    onChange(next);
  };

  const removeEntry = (key: string) => {
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k !== key) next[k] = v;
    }
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-center gap-2">
          <Input
            placeholder="KEY"
            value={key}
            onChange={(e) => updateEntry(key, e.target.value, val)}
            className="w-1/3"
          />
          <Input
            placeholder="value"
            value={val}
            onChange={(e) => updateEntry(key, key, e.target.value)}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => removeEntry(key)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="xs" onClick={addEntry}>
        <Plus className="h-3 w-3" />
        Add Variable
      </Button>
    </div>
  );
}

function EnvironmentRow({
  env,
  onEdit,
  onDelete,
}: {
  env: EnvironmentInfo;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FolderTree className="text-muted-foreground h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{env.name}</p>
          <p className="text-muted-foreground text-xs">
            {Object.keys(env.variables).length} variables
            {env.deploymentCount > 0 && ` · ${env.deploymentCount} deployment${env.deploymentCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-xs" onClick={onEdit} title="Edit">
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onDelete} title="Delete">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function EnvironmentManager({ projectId }: { projectId: string }) {
  const { data: environments, isLoading } = useEnvironments(projectId);
  const createMutation = useCreateEnvironment(projectId);
  const updateMutation = useUpdateEnvironment(projectId);
  const deleteMutation = useDeleteEnvironment(projectId);

  const [createOpen, setCreateOpen] = useState(false);
  const [editEnv, setEditEnv] = useState<EnvironmentInfo | null>(null);
  const [deleteEnv, setDeleteEnv] = useState<EnvironmentInfo | null>(null);

  const [createName, setCreateName] = useState('');
  const [createVariables, setCreateVariables] = useState<Record<string, string>>({});

  const [editName, setEditName] = useState('');
  const [editVariables, setEditVariables] = useState<Record<string, string>>({});

  const handleCreate = async () => {
    const input: CreateEnvironmentInput = {
      name: createName,
      variables: createVariables,
    };
    await createMutation.mutateAsync(input);
    setCreateOpen(false);
    setCreateName('');
    setCreateVariables({});
  };

  const handleEdit = async () => {
    if (!editEnv) return;
    await updateMutation.mutateAsync({
      envId: editEnv.id,
      input: { name: editName, variables: editVariables },
    });
    setEditEnv(null);
  };

  const handleDelete = async () => {
    if (!deleteEnv) return;
    await deleteMutation.mutateAsync(deleteEnv.id);
    setDeleteEnv(null);
  };

  const openEdit = (env: EnvironmentInfo) => {
    setEditName(env.name);
    setEditVariables({ ...env.variables });
    setEditEnv(env);
  };

  if (isLoading) return <Loading label="Loading environments..." />;

  const items = environments ?? [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardAction>
            <Button size="xs" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3 w-3" />
              New
            </Button>
          </CardAction>
          <CardTitle className="text-sm font-medium">Environments</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title="No environments"
              description="Create environments to manage deployment targets."
              action={{ label: 'Create Environment', onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <div className="space-y-2">
              {items.map((env) => (
                <EnvironmentRow
                  key={env.id}
                  env={env}
                  onEdit={() => openEdit(env)}
                  onDelete={() => setDeleteEnv(env)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Environment</DialogTitle>
            <DialogDescription>Add a new deployment environment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Environment name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
            />
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">Variables</p>
              <KeyValueEditor value={createVariables} onChange={setCreateVariables} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleCreate} disabled={!createName.trim() || createMutation.isPending}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editEnv} onOpenChange={(open) => !open && setEditEnv(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Environment</DialogTitle>
            <DialogDescription>Update environment configuration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Environment name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">Variables</p>
              <KeyValueEditor value={editVariables} onChange={setEditVariables} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button onClick={handleEdit} disabled={!editName.trim() || updateMutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteEnv} onOpenChange={(open) => !open && setDeleteEnv(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Environment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteEnv?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
