import { ProjectForm } from '@/features/projects/components/project-form';

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
        <p className="text-muted-foreground text-sm">Describe what you want to build.</p>
      </div>
      <ProjectForm />
    </div>
  );
}
