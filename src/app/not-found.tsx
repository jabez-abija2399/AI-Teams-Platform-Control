import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_NAME, ROUTES } from '@/config/constants';

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(36,95,115,0.12),transparent_55%)]" />
      <div className="relative mx-auto max-w-md text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This page doesn&apos;t exist or you don&apos;t have access. Head back to {APP_NAME}.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <Link href={ROUTES.home} className={cn(buttonVariants(), 'rounded-xl')}>
            Go home
          </Link>
          <Link
            href={ROUTES.projects}
            className={cn(buttonVariants({ variant: 'outline' }), 'gap-1.5 rounded-xl')}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
