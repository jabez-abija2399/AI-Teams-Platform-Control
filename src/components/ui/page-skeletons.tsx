import { Skeleton } from '@/components/ui/loading';
import { PageContainer } from '@/components/layout/page-container';

/** Dashboard / projects list skeleton */
export function ProjectsPageSkeleton() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/80 bg-card/80 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-12 w-full rounded-lg" />
            <Skeleton className="mt-5 h-3 w-32" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

export function DashboardPageSkeleton() {
  return (
    <PageContainer>
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/80 bg-card/80 p-5">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <Skeleton className="mt-3 h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-4 w-32" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </PageContainer>
  );
}

/** Mission Control / pipeline first-load skeleton */
export function MissionControlSkeleton({ projectName }: { projectName?: string }) {
  return (
    <div className="flex h-dvh flex-col bg-background" role="status" aria-busy="true" aria-label="Opening Mission Control">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border/80 bg-card/90 px-4 lg:h-[52px]">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="hidden h-3 w-24 sm:block" />
        </div>
        <Skeleton className="ml-auto h-7 w-20 rounded-md" />
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-6">
        {projectName && (
          <p className="text-sm text-muted-foreground">
            Opening <span className="font-medium text-foreground">{projectName}</span>…
          </p>
        )}
        <div className="grid flex-1 gap-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
          <div className="hidden space-y-3 lg:block">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Studio / IDE workspace skeleton (deterministic widths — no Math.random) */
export function StudioWorkspaceSkeleton() {
  const lineWidths = [72, 88, 54, 91, 63, 79, 45, 85, 58, 70, 92, 48];

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background" role="status" aria-busy="true">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border/70 bg-card px-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Skeleton className="hidden h-7 w-64 rounded-md sm:block" />
        <div />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-12 flex-col items-center gap-3 border-r border-border/70 bg-card p-3 md:flex">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-5 rounded" />
          ))}
        </div>

        <div className="hidden w-60 flex-col gap-3 border-r border-border/70 bg-card p-3 md:flex">
          <Skeleton className="h-4 w-24" />
          {[70, 55, 82, 48, 66, 74].map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border/70 bg-card px-2">
            {[80, 72, 64].map((w, i) => (
              <Skeleton key={i} className="h-6 rounded-t" style={{ width: w }} />
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-3 bg-muted/30 p-6">
            {lineWidths.map((w, i) => (
              <Skeleton key={i} className="h-3" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>

        <div className="hidden w-80 flex-col border-l border-border/70 bg-card lg:flex">
          <div className="flex h-10 items-center gap-2 border-b border-border/70 px-3">
            {[56, 64, 48].map((w, i) => (
              <Skeleton key={i} className="h-5 rounded" style={{ width: w }} />
            ))}
          </div>
          <div className="space-y-3 p-3">
            {[60, 80, 45, 70].map((w, i) => (
              <Skeleton key={i} className="h-3" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
