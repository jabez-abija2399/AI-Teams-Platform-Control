import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthSession } from '@/lib/session-helper';
import { listProjects } from '@/features/projects/services/project.service';
import { ROUTES } from '@/config/constants';
import { ArrowRight, Brain, Layers, Sparkles, Terminal } from 'lucide-react';

export const metadata = { title: 'Welcome | HibirDev AI' };

export default async function WelcomePage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');

  const projects = await listProjects(session.user.id);
  if (projects.length > 0) redirect(ROUTES.projects);

  const userName = session.user.name?.split(' ')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12 font-sans">
      {/* Blueprint bg */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(60,73,73,0.5) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(60,73,73,0.5) 0.5px, transparent 0.5px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-2xl w-full text-center">
        {/* Status pill */}
        <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/5 px-4 py-1.5 rounded-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-wider">
            System Ready
          </span>
        </div>

        <div>
          <h1 className="font-sans text-4xl md:text-5xl font-bold text-on-surface mb-3">
            Welcome, {userName}.
          </h1>
          <p className="font-sans text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Your AI software company is ready to build. Describe your first project and four specialized agents will turn it into working software.
          </p>
        </div>

        {/* Agent pipeline preview */}
        <div className="w-full border border-outline-variant/60 bg-surface-container-low p-5 flex flex-col gap-3">
          <p className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-left">Your AI Workforce</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'CEO', icon: Brain, desc: 'Product Strategy' },
              { label: 'ARCHITECT', icon: Layers, desc: 'System Design' },
              { label: 'DESIGNER', icon: Sparkles, desc: 'UI / UX' },
              { label: 'DEVELOPER', icon: Terminal, desc: 'Code & Build' },
            ].map(({ label, icon: Icon, desc }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 p-3 border border-outline-variant/40 bg-background">
                <Icon className="w-4 h-4 text-primary" />
                <span className="font-mono text-[10px] font-bold text-on-surface uppercase">{label}</span>
                <span className="font-mono text-[10px] text-on-surface-variant">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        <Link href={`${ROUTES.projects}/new`}>
          <button className="bg-primary text-black font-mono text-sm font-bold py-3 px-8 rounded hover:bg-primary-container transition-colors flex items-center gap-2.5">
            Start Your First Project
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>

        <Link href={ROUTES.dashboard} className="font-mono text-xs text-on-surface-variant hover:text-primary transition-colors">
          Skip to dashboard →
        </Link>
      </div>
    </div>
  );
}
