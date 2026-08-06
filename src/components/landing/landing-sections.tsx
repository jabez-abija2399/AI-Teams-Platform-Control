import Link from 'next/link';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Code2,
  FolderTree,
  Layers,
  Rocket,
  Shield,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_NAME, ROUTES } from '@/config/constants';
import { MissionControlPreview } from '@/components/shared/mission-control-preview';

const SHOWCASE_PANES = [
  { id: 'mission', label: 'Mission Control', icon: Rocket },
  { id: 'studio', label: 'Workspace IDE', icon: Code2 },
  { id: 'explorer', label: 'Explorer', icon: FolderTree },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
] as const;

const TRUST = ['Enterprise ready', 'Production quality', 'Secure by design', 'Human approval gates'] as const;

const TEAM = [
  { role: 'CEO AI', dept: 'Leadership', focus: 'Vision & decisions' },
  { role: 'Product Manager', dept: 'Product', focus: 'Requirements' },
  { role: 'Architect', dept: 'Architecture', focus: 'System design' },
  { role: 'UI Designer', dept: 'Design', focus: 'Interfaces' },
  { role: 'Engineers', dept: 'Engineering', focus: 'Frontend · Backend · Data' },
  { role: 'QA & Security', dept: 'Quality', focus: 'Tests & reviews' },
  { role: 'DevOps', dept: 'Operations', focus: 'Deploy & monitor' },
] as const;

const FEATURES = [
  {
    icon: Bot,
    title: 'AI Software Company',
    description:
      'Specialized AI employees collaborate like a real engineering org — not a single chatbot answering prompts.',
  },
  {
    icon: Layers,
    title: 'End-to-end pipeline',
    description:
      'Discovery through architecture, development, testing, security, and deployment — fully orchestrated.',
  },
  {
    icon: Shield,
    title: 'Human approval gates',
    description:
      'Stay in control with checkpoints at product, design, architecture, and deployment milestones.',
  },
  {
    icon: Rocket,
    title: 'Mission Control',
    description:
      'Watch your AI team work in real time — activity feeds, phase timelines, artifacts, and workspace IDE.',
  },
] as const;

const STEPS = [
  {
    step: '01',
    title: 'Describe your idea',
    detail: 'Tell the AI CEO what you want to build — once.',
  },
  {
    step: '02',
    title: 'Review & approve',
    detail: 'Product specs and architecture plans land at your desk.',
  },
  {
    step: '03',
    title: 'AI company builds',
    detail: 'Designers, engineers, QA, and DevOps collaborate autonomously.',
  },
  {
    step: '04',
    title: 'Ship to production',
    detail: 'Receive working software with documentation and deployments.',
  },
] as const;

const FOOTER_LINKS = [
  { href: '#features', label: 'Product' },
  { href: '#company', label: 'AI Company' },
  { href: '#workspace', label: 'Workspace' },
  { href: '#how-it-works', label: 'How it works' },
  { href: ROUTES.login, label: 'Sign in' },
  { href: ROUTES.register, label: 'Get started' },
] as const;

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={ROUTES.home} className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#company" className="transition-colors hover:text-foreground">
            Company
          </a>
          <a href="#workspace" className="transition-colors hover:text-foreground">
            Workspace
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link href={ROUTES.login} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            Sign in
          </Link>
          <Link href={ROUTES.register} className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 shadow-sm')}>
            Start building
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_-15%,rgba(36,95,115,0.16),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(115,62,36,0.09),transparent_42%)]" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-16 pt-20 text-center sm:px-6 sm:pb-20 sm:pt-24 lg:pt-28">
        <p className="animate-fade-up font-heading text-5xl font-semibold tracking-tight text-primary sm:text-6xl lg:text-7xl">
          {APP_NAME}
        </p>
        <h1
          className="animate-fade-up mt-6 max-w-3xl text-balance text-2xl font-medium tracking-tight text-foreground sm:text-3xl lg:text-[2.5rem] lg:leading-tight"
          style={{ animationDelay: '70ms' }}
        >
          Build software with an entire AI company.
        </h1>
        <p
          className="animate-fade-up mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: '130ms' }}
        >
          Describe your idea once. AI CEO, product, architecture, design, engineering, QA, security,
          and DevOps collaborate to plan, build, and ship production-ready applications.
        </p>
        <div
          className="animate-fade-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: '190ms' }}
        >
          <Link
            href={ROUTES.register}
            className={cn(buttonVariants({ size: 'lg' }), 'min-w-[180px] gap-2 shadow-md')}
          >
            Start building
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={ROUTES.login}
            className={cn(
              buttonVariants({ size: 'lg', variant: 'outline' }),
              'min-w-[180px] border-border/80 bg-card/60',
            )}
          >
            Sign in
          </Link>
        </div>

        <ul
          className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground sm:text-[13px]"
          style={{ animationDelay: '240ms' }}
        >
          {TRUST.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary/70" />
              {item}
            </li>
          ))}
        </ul>

        <div className="animate-fade-up relative mt-14 w-full max-w-5xl" style={{ animationDelay: '300ms' }}>
          <MissionControlPreview />
        </div>
      </div>
    </section>
  );
}

export function LandingCompany() {
  return (
    <section id="company" className="border-t border-border/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Meet your AI software company
          </h2>
          <p className="mt-4 text-muted-foreground">
            Specialized roles that collaborate the way a real product team does — with you as product
            owner.
          </p>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TEAM.map((member) => (
            <div
              key={member.role}
              className="group rounded-2xl border border-border/80 bg-card/60 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_16px_40px_-28px_rgba(36,95,115,0.5)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-semibold text-primary">
                  {member.role
                    .split(' ')
                    .map((w) => w[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                  <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-primary" />
                  Online
                </span>
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold tracking-tight">{member.role}</h3>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {member.dept}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{member.focus}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingShowcase() {
  return (
    <section id="workspace" className="border-t border-border/60 bg-card/35 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            One workspace for the whole company
          </h2>
          <p className="mt-4 text-muted-foreground">
            Mission Control, Studio IDE, Explorer, preview, and deploy — the same surfaces your AI
            team uses to ship.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {SHOWCASE_PANES.map(({ id, label, icon: Icon }) => (
            <span
              key={id}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground"
            >
              <Icon className="h-3.5 w-3.5 text-primary" />
              {label}
            </span>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-2xl border border-border/80 bg-background shadow-[0_28px_80px_-40px_rgba(36,95,115,0.5)]">
          <div className="flex items-center gap-2 border-b border-border/70 bg-muted/25 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-gray/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-brand-gray/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-brand-gray/80" />
            <span className="ml-3 text-xs font-medium text-muted-foreground">Studio · Project workspace</span>
            <span className="ml-auto hidden text-[11px] text-muted-foreground sm:inline">
              Preview · Git · Deploy
            </span>
          </div>

          <div className="grid min-h-[320px] lg:grid-cols-[200px_1fr_220px]">
            <aside className="hidden border-r border-border/60 p-4 lg:block">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Explorer
              </p>
              <ul className="mt-3 space-y-1.5 font-mono text-[12px] text-muted-foreground">
                <li className="rounded-md bg-primary/10 px-2 py-1.5 text-foreground">src/</li>
                <li className="px-2 py-1 pl-5">app/page.tsx</li>
                <li className="px-2 py-1 pl-5">components/</li>
                <li className="px-2 py-1 pl-5">api/routes.ts</li>
                <li className="rounded-md px-2 py-1.5">prisma/schema.prisma</li>
                <li className="rounded-md px-2 py-1.5">README.md</li>
              </ul>
            </aside>

            <div className="flex flex-col border-b border-border/60 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2 text-[11px] text-muted-foreground">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-medium text-primary">page.tsx</span>
                <span>api/routes.ts</span>
              </div>
              <pre className="flex-1 overflow-hidden p-4 font-mono text-[12px] leading-6 text-muted-foreground">
                <code>
                  <span className="text-primary/80">{'// Generated by Frontend Engineer'}</span>
                  {'\n'}
                  <span className="text-foreground">{'export default function Page() {'}</span>
                  {'\n'}
                  {'  '}
                  <span className="text-foreground">{'return ('}</span>
                  {'\n'}
                  {'    '}
                  <span className="text-accent">{'<main className="workspace">'}</span>
                  {'\n'}
                  {'      '}
                  <span className="text-foreground">{'<MissionControl />'}</span>
                  {'\n'}
                  {'      '}
                  <span className="text-foreground">{'<LivePreview />'}</span>
                  {'\n'}
                  {'    '}
                  <span className="text-accent">{'</main>'}</span>
                  {'\n'}
                  <span className="text-foreground">{'}'}</span>
                </code>
              </pre>
              <div className="border-t border-border/50 bg-muted/20 px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                <span className="text-primary">➜</span> npm run build · ready in 1.2s
              </div>
            </div>

            <aside className="space-y-4 p-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Activity
                </p>
                <ul className="mt-3 space-y-2.5 text-left text-sm">
                  <li className="flex gap-2 text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 animate-soft-pulse rounded-full bg-primary" />
                    Architect updated system diagram
                  </li>
                  <li className="flex gap-2 text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gray" />
                    QA queued regression suite
                  </li>
                  <li className="flex gap-2 text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gray" />
                    Preview synced to Studio
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/80 p-3">
                <p className="text-[11px] font-medium text-muted-foreground">Deploy</p>
                <p className="mt-1 text-sm font-medium">Staging · ready</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[72%] rounded-full bg-primary" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="border-t border-border/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Built like a company, not a chat window
          </h2>
          <p className="mt-4 text-muted-foreground">
            Structure, memory, approvals, and delivery — the pieces you need to trust software built by
            AI.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/80 bg-background/80 p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_20px_48px_-32px_rgba(36,95,115,0.55)]"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border/60 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            From idea to production
          </h2>
          <p className="mt-4 text-muted-foreground">
            A clear lifecycle with you in the loop — AI handles the heavy lifting between approvals.
          </p>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ step, title, detail }, i) => (
            <div
              key={step}
              className="relative rounded-2xl border border-border/80 bg-card/50 p-6 shadow-[0_1px_0_rgba(36,95,115,0.04)]"
            >
              {i < STEPS.length - 1 && (
                <span
                  className="pointer-events-none absolute -right-2 top-10 hidden h-px w-4 bg-border lg:block"
                  aria-hidden
                />
              )}
              <span className="font-heading text-4xl font-semibold text-accent/20">{step}</span>
              <h3 className="mt-3 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingCta() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground shadow-[0_28px_80px_-36px_rgba(36,95,115,0.7)] sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-accent/25" />
          <h2 className="relative font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to build with an entire AI company?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Stop coordinating teams. Start shipping products.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={ROUTES.register}
              className={cn(
                buttonVariants({ size: 'lg', variant: 'secondary' }),
                'gap-2 bg-card text-foreground hover:bg-card/90',
              )}
            >
              Start building
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={ROUTES.login}
              className={cn(
                buttonVariants({ size: 'lg', variant: 'outline' }),
                'border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground',
              )}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-heading text-sm font-semibold">{APP_NAME}</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>
    </footer>
  );
}
