import Link from 'next/link';
import { Plus, Sparkles } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';

/** Empty projects state — one clear path to create */
export function EmptyProjectPrompt() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center rounded-2xl border border-dashed border-border/80 bg-card/60 px-6 py-14 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <Sparkles className="h-5 w-5" />
      </div>
      <h2 className="font-heading text-2xl font-semibold tracking-tight">Create your first project</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Describe what you want to build. Your AI company handles discovery, design, development, and
        shipping — with you in control.
      </p>
      <Link
        href={`${ROUTES.projects}/new`}
        className={cn(buttonVariants({ size: 'lg' }), 'mt-7 h-11 gap-2 rounded-xl px-6 shadow-sm')}
      >
        <Plus className="h-4 w-4" />
        New project
      </Link>
    </div>
  );
}

export default function EmptyProjectsFallback() {
  return (
    <PageContainer>
      <EmptyProjectPrompt />
    </PageContainer>
  );
}
