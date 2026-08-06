import { MissionControlPreview } from '@/components/shared/mission-control-preview';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_-10%,rgba(36,95,115,0.16),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(115,62,36,0.09),transparent_42%)]" />

      <div className="relative mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="mx-auto w-full max-w-md lg:mx-0">{children}</div>

        <div className="hidden lg:block">
          <p className="mb-4 font-heading text-2xl font-semibold tracking-tight text-foreground">
            Your AI company, ready to build
          </p>
          <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Sign in to Mission Control — watch specialized AI employees plan, design, build, and ship
            with you as product owner.
          </p>
          <MissionControlPreview dense />
        </div>
      </div>
    </main>
  );
}
