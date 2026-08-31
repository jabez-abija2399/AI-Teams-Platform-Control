import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthSession } from '@/lib/session-helper';
import {
  getDashboardStats,
  getRecentProjects,
} from '@/features/dashboard/services/dashboard.service';
import { ROUTES } from '@/config/constants';
import {
  Search,
  Plus,
  Bell,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Clock,
  AlertTriangle,
  Brain,
  Layers,
  Sparkles,
  Terminal,
  Eye,
  ChevronRight,
  FileText,
  Code,
  Check,
  ArrowDown,
  UserCheck,
} from 'lucide-react';

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const [stats, recentProjects] = await Promise.all([
    getDashboardStats(userId),
    getRecentProjects(userId),
  ]);

  const activeProject = recentProjects[0];
  const hasProjects = recentProjects.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-on-background overflow-y-auto">
      {/* Header / Top Bar */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 md:px-8 shrink-0 sticky top-0 bg-background/90 backdrop-blur-md z-20">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface-variant uppercase tracking-wider mb-0.5">
            <span>WORKSPACE</span>
            <ChevronRight className="w-3 h-3 text-on-surface-variant/60" />
            <span className="text-white font-bold">OVERVIEW</span>
          </div>
          <p className="font-sans text-xs text-on-surface-variant">
            Good morning. Here's the current state of your software projects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded border border-white/10 text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded bg-primary text-black font-mono font-bold flex items-center justify-center text-xs">
            {session.user.name?.[0] || 'U'}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {!hasProjects ? (
        /* EMPTY STATE WORKSPACE DASHBOARD */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
          <div className="max-w-xl flex flex-col items-center gap-6">
            <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-white leading-tight">
              Your first software project starts here.
            </h1>
            <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
              Describe what you want to build and HibirDev AI will guide it through product definition, architecture, design, and implementation.
            </p>

            <Link href={`${ROUTES.projects}/new`}>
              <button
                type="button"
                className="bg-primary text-black font-mono text-sm font-bold px-6 py-3.5 rounded flex items-center gap-2.5 hover:bg-primary-container transition-colors uppercase tracking-wider glow-cyan"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Project</span>
              </button>
            </Link>

            {/* Vertical Workflow Spine Visual */}
            <div className="mt-8 flex flex-col items-center gap-3 font-mono text-xs font-bold text-on-surface-variant">
              <div className="px-4 py-2 bg-surface border border-white/10 rounded uppercase">IDEA</div>
              <ArrowDown className="w-4 h-4 text-primary" />
              <div className="px-4 py-2 bg-surface border border-white/10 rounded flex items-center gap-2 uppercase">
                <Brain className="w-3.5 h-3.5" /> CEO
              </div>
              <ArrowDown className="w-4 h-4 text-primary" />
              <div className="px-4 py-2 bg-surface border border-white/10 rounded flex items-center gap-2 uppercase">
                <Layers className="w-3.5 h-3.5" /> ARCHITECT
              </div>
              <ArrowDown className="w-4 h-4 text-primary" />
              <div className="px-4 py-2 bg-surface border border-white/10 rounded flex items-center gap-2 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> DESIGNER
              </div>
              <ArrowDown className="w-4 h-4 text-primary" />
              <div className="px-4 py-2 bg-surface border border-white/10 rounded flex items-center gap-2 uppercase">
                <Terminal className="w-3.5 h-3.5" /> DEVELOPER
              </div>
              <ArrowDown className="w-4 h-4 text-primary" />
              <div className="px-6 py-2.5 bg-primary/10 border border-primary text-primary rounded font-bold uppercase tracking-wider glow-cyan">
                SOFTWARE
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE WORKSPACE DASHBOARD */
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-16">
          {/* Top Row: Active Project (2 cols) & Needs Attention (1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Project Card */}
            <section className="lg:col-span-2 bg-surface rounded-lg p-6 relative overflow-hidden flex flex-col justify-between min-h-[320px] border border-white/10">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container-high border border-white/10 mb-3">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-white font-bold">
                        ACTIVE PROJECT
                      </span>
                    </div>
                    <h3 className="font-heading text-3xl font-extrabold text-white mb-1">
                      {activeProject?.name || 'StudyMate'}
                    </h3>
                    <p className="font-sans text-xs text-on-surface-variant">
                      {activeProject?.description || 'AI-powered study assistant application'}
                    </p>
                  </div>

                  {activeProject && (
                    <Link href={`${ROUTES.projects}/${activeProject.id}/workspace`}>
                      <button
                        type="button"
                        className="bg-primary text-black font-mono text-xs font-bold px-4 py-2.5 rounded hover:bg-primary-container transition-colors flex items-center gap-2 uppercase tracking-wider glow-cyan"
                      >
                        <span>Continue Building</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Pipeline Progress Footer */}
              <div className="mt-auto bg-background/80 p-4 rounded border border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2 font-mono text-xs">
                  <span className="text-on-surface-variant">
                    PHASE: <span className="text-primary font-bold">DESIGN</span>
                  </span>
                  <span className="text-on-surface-variant font-bold">STEP 03/04</span>
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-3 flex">
                  <div className="h-full bg-primary w-1/4" />
                  <div className="h-full bg-primary w-1/4" />
                  <div className="h-full bg-primary w-1/4 animate-pulse" />
                  <div className="h-full bg-transparent w-1/4" />
                </div>

                <div className="flex items-center justify-between font-mono text-[11px] uppercase">
                  <div className="flex items-center gap-1.5 text-on-surface-variant opacity-60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-on-surface-variant" />
                    <span>CEO</span>
                  </div>
                  <div className="w-4 h-px bg-white/10" />
                  <div className="flex items-center gap-1.5 text-on-surface-variant opacity-60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-on-surface-variant" />
                    <span>ARCHITECT</span>
                  </div>
                  <div className="w-4 h-px bg-white/10" />
                  <div className="flex items-center gap-1.5 text-primary font-bold">
                    <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                    <span>DESIGNER</span>
                  </div>
                  <div className="w-4 h-px bg-white/10" />
                  <div className="flex items-center gap-1.5 text-on-surface-variant opacity-30">
                    <Clock className="w-3.5 h-3.5" />
                    <span>DEVELOPER</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Needs Attention Card */}
            <section className="bg-surface rounded-lg p-6 flex flex-col justify-between border-t-[3px] border-t-primary border-x border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-4 text-primary">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider">NEEDS YOUR ATTENTION</h3>
                </div>
                <div className="p-4 bg-background border border-white/10 rounded relative mb-4">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                  <p className="font-sans text-xs font-semibold text-white mb-1">
                    Design specification ready for review
                  </p>
                  <p className="font-mono text-[11px] text-on-surface-variant">
                    Project: {activeProject?.name || 'StudyMate'} • Agent: Designer
                  </p>
                </div>
              </div>

              {activeProject && (
                <Link href={`${ROUTES.projects}/${activeProject.id}/workspace`}>
                  <button
                    type="button"
                    className="w-full bg-transparent border border-primary text-primary font-mono text-xs font-bold py-2.5 rounded hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Review Design</span>
                  </button>
                </Link>
              )}
            </section>
          </div>

          {/* YOUR AI TEAM Section */}
          <section className="flex flex-col gap-4">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              YOUR AI TEAM
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* CEO */}
              <div className="bg-surface p-4 rounded-lg border border-white/10 flex flex-col gap-3 opacity-60 hover:opacity-100 transition-all">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-on-surface-variant" />
                    <span className="font-sans text-xs font-bold text-white">CEO</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-on-surface-variant" />
                </div>
                <p className="font-mono text-[11px] text-on-surface-variant">Product Spec</p>
                <div className="mt-auto pt-2 flex justify-between items-center font-mono text-[10px] text-on-surface-variant">
                  <span>STATUS: DONE</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Architect */}
              <div className="bg-surface p-4 rounded-xl border border-white/10 flex flex-col gap-3 opacity-60 hover:opacity-100 transition-all">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-on-surface-variant" />
                    <span className="font-sans text-xs font-bold text-white">Architect</span>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-on-surface-variant" />
                </div>
                <p className="font-mono text-[11px] text-on-surface-variant">Arch Spec</p>
                <div className="mt-auto pt-2 flex justify-between items-center font-mono text-[10px] text-on-surface-variant">
                  <span>STATUS: DONE</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Designer (Active) */}
              <div className="bg-surface-container-low p-4 rounded-lg border border-primary/40 flex flex-col gap-3 relative overflow-hidden glow-border">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-sans text-xs font-bold text-white">Designer</span>
                  </div>
                  <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                </div>
                <p className="font-mono text-[11px] text-on-surface-variant">Design Spec</p>
                <div className="mt-auto pt-2 flex justify-between items-center font-mono text-[10px] text-primary font-bold">
                  <span>STATUS: WORKING</span>
                  <span>85%</span>
                </div>
              </div>

              {/* Developer */}
              <div className="bg-surface p-4 rounded-lg border border-white/10 flex flex-col gap-3 opacity-40 hover:opacity-100 transition-all">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-on-surface-variant" />
                    <span className="font-sans text-xs font-bold text-white">Developer</span>
                  </div>
                  <Clock className="w-4 h-4 text-on-surface-variant" />
                </div>
                <p className="font-mono text-[11px] text-on-surface-variant">Implementation</p>
                <div className="mt-auto pt-2 flex justify-between items-center font-mono text-[10px] text-on-surface-variant">
                  <span>STATUS: WAITING</span>
                  <span>0%</span>
                </div>
              </div>
            </div>
          </section>

          {/* ARTIFACT OVERVIEW & EVENT TIMELINE Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ARTIFACT OVERVIEW */}
            <section className="bg-surface rounded-lg p-6 border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  ARTIFACT OVERVIEW
                </h3>
                <a href="#artifacts" className="font-mono text-xs text-primary hover:underline font-bold">
                  View All
                </a>
              </div>

              <div className="flex flex-col gap-2 font-mono text-xs">
                {/* Item 1 */}
                <div className="flex items-center justify-between p-3 bg-background border border-white/10 rounded">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-on-surface-variant" />
                    <div>
                      <p className="text-white font-bold">PRD_StudyMate_v1.md</p>
                      <p className="text-[10px] text-on-surface-variant">Product Specification</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] bg-surface-container-high border border-white/10 text-on-surface-variant rounded uppercase font-bold">
                    READY
                  </span>
                </div>

                {/* Item 2 */}
                <div className="flex items-center justify-between p-3 bg-background border border-white/10 rounded">
                  <div className="flex items-center gap-3">
                    <Code className="w-4 h-4 text-on-surface-variant" />
                    <div>
                      <p className="text-white font-bold">Arch_StudyMate_v1.json</p>
                      <p className="text-[10px] text-on-surface-variant">Architecture Specification</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] bg-surface-container-high border border-white/10 text-on-surface-variant rounded uppercase font-bold">
                    READY
                  </span>
                </div>

                {/* Item 3 (Active) */}
                <div className="flex items-center justify-between p-3 bg-background border border-primary/40 rounded relative">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                  <div className="flex items-center gap-3 pl-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-white font-bold">Design_System_StudyMate.css</p>
                      <p className="text-[10px] text-on-surface-variant">Design Tokens & Guidelines</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] bg-primary/10 border border-primary text-primary rounded uppercase font-bold">
                    IN PROGRESS
                  </span>
                </div>

                {/* Item 4 */}
                <div className="flex items-center justify-between p-3 bg-background border border-white/10 rounded opacity-50">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-on-surface-variant" />
                    <div>
                      <p className="text-white font-bold">Source_Code_StudyMate.zip</p>
                      <p className="text-[10px] text-on-surface-variant">Implementation Files</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] bg-surface-container-high border border-white/10 text-on-surface-variant rounded uppercase font-bold">
                    PENDING
                  </span>
                </div>
              </div>
            </section>

            {/* EVENT TIMELINE */}
            <section className="bg-surface rounded-lg p-6 border border-white/10 flex flex-col gap-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                EVENT TIMELINE
              </h3>

              <div className="flex flex-col gap-4 pl-3 border-l border-white/10 font-mono text-xs relative">
                {/* Event 1 */}
                <div className="flex flex-col gap-1 relative">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold">Designer</span>
                    <span className="text-[10px] text-on-surface-variant">Just now</span>
                  </div>
                  <p className="text-on-surface-variant font-sans text-xs">
                    Updated color palette tokens in Design Spec.
                  </p>
                </div>

                {/* Event 2 */}
                <div className="flex flex-col gap-1 relative">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-on-surface-variant/40" />
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">Architect</span>
                    <span className="text-[10px] text-on-surface-variant">1h ago</span>
                  </div>
                  <p className="text-on-surface-variant font-sans text-xs">
                    Completed Architecture Specification (Arch_StudyMate_v1.json).
                  </p>
                </div>

                {/* Event 3 */}
                <div className="flex flex-col gap-1 relative">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-on-surface-variant/40" />
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">Architect</span>
                    <span className="text-[10px] text-on-surface-variant">1.5h ago</span>
                  </div>
                  <p className="text-on-surface-variant font-sans text-xs">
                    Began drafting database schemas and API endpoints.
                  </p>
                </div>

                {/* Event 4 */}
                <div className="flex flex-col gap-1 relative">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-on-surface-variant/40" />
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold">CEO</span>
                    <span className="text-[10px] text-on-surface-variant">2h ago</span>
                  </div>
                  <p className="text-on-surface-variant font-sans text-xs">
                    Product specification completed and approved.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
