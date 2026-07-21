'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createProjectSchema,
  type CreateProjectInput,
} from '@/features/projects/schemas/project.schema';
import { ROUTES } from '@/config/constants';

interface Org { id: string; name: string }

export function ProjectForm() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
  });

  useEffect(() => {
    fetch('/api/organizations')
      .then((r) => r.json())
      .then((j) => { if (j.success) setOrgs(j.data); })
      .catch(() => {});
  }, []);

  async function onSubmit(data: CreateProjectInput) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();

    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    toast.success('Project created');
    router.push(`${ROUTES.projects}/${result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Project name
        </label>
        <Input id="name" placeholder="e.g. Customer Portal" {...register('name')} />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Input id="description" placeholder="What are you building?" {...register('description')} />
        {errors.description && (
          <p className="text-destructive text-xs">{errors.description.message}</p>
        )}
      </div>

      {orgs.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor="organizationId" className="text-sm font-medium">
            Organization <span className="text-muted-foreground">(optional)</span>
          </label>
          <select
            id="organizationId"
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            {...register('organizationId')}
          >
            <option value="">No organization</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create project'}
      </Button>
    </form>
  );
}
