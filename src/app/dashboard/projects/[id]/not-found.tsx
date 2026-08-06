import Link from 'next/link';
import { ArrowLeft, FolderKanban } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';

export default function ProjectNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <FolderKanban className="h-5 w-5" />
      </div>
      <h1 className="font-heading text-xl font-semibold tracking-tight">Project not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This project doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link
        href={ROUTES.projects}
        className={cn(buttonVariants({ size: 'sm' }), 'mt-6 gap-1.5 rounded-xl')}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to projects
      </Link>
    </div>
  );
}
