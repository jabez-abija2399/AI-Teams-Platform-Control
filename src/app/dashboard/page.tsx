import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthSession } from '@/lib/session-helper';
import {
  getDashboardStats,
  getRecentProjects,
} from '@/features/dashboard/services/dashboard.service';
import { ProjectCard } from '@/features/projects/components/project-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ROUTES } from '@/config/constants';
import { Search, Plus, SlidersHorizontal, FolderKanban, Terminal, Code2, Cpu, Rocket, Sparkles } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const [stats, recentProjects] = await Promise.all([
    getDashboardStats(userId),
    getRecentProjects(userId),
  ]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative z-10 overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {/* ACTIONS HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-white mb-1 tracking-tight">
              AI Portfolio Matrix
            </h1>
            <p className="font-mono text-xs text-on-surface-variant">
              Global operational overview of managed orchestration projects.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72 bg-surface flex items-center px-3 border border-white/10 focus-within:border-primary">
              <Search className="text-on-surface-variant w-4 h-4 mr-2" />
              <input
                className="w-full bg-transparent border-none text-white font-mono text-xs py-2.5 focus:outline-none placeholder:text-on-surface-variant/40"
                placeholder="Search projects by scope..."
                type="text"
              />
            </div>
            <button
              type="button"
              className="bg-surface border border-white/10 text-on-surface p-2.5 hover:bg-surface-container-high hover:border-primary/50 transition-colors flex items-center justify-center"
            >
              <SlidersHorizontal className="w-4 h-4 text-on-surface-variant" />
            </button>
            <Link href={`${ROUTES.projects}/new`}>
              <button
                type="button"
                className="bg-primary text-background font-mono text-xs font-bold px-6 py-3 border border-primary hover:bg-transparent hover:text-primary transition-all duration-200 flex items-center gap-2 whitespace-nowrap uppercase tracking-wider offset-shadow"
              >
                <Plus className="w-4 h-4" />
                <span>Launch New Build</span>
              </button>
            </Link>
          </div>
        </header>

        {/* SECTION 2: TOP METRICS BAR */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          {/* Metrics card 1 */}
          <div className="brutal-offset-container">
            <div className="brutal-offset-bg" />
            <div className="bg-surface p-6 flex flex-col h-full min-h-[130px] border border-white/10 hover:border-primary/50 transition-colors">
              <span className="font-mono text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-2 uppercase tracking-wider">
                <FolderKanban className="text-primary w-4 h-4" /> Active Projects
              </span>
              <div className="font-heading text-4xl font-extrabold text-primary mt-auto">
                {stats.totalProjects}
              </div>
            </div>
          </div>

          {/* Metrics card 2 */}
          <div className="brutal-offset-container">
            <div className="brutal-offset-bg" />
            <div className="bg-surface p-6 flex flex-col h-full min-h-[130px] border border-white/10 hover:border-primary/50 transition-colors">
              <span className="font-mono text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-2 uppercase tracking-wider">
                <Code2 className="text-primary w-4 h-4" /> Codebase Lines
              </span>
              <div className="font-heading text-4xl font-extrabold text-white mt-auto">1.2M</div>
            </div>
          </div>

          {/* Metrics card 3 */}
          <div className="brutal-offset-container">
            <div className="brutal-offset-bg" />
            <div className="bg-surface p-6 flex flex-col h-full min-h-[130px] border border-white/10 hover:border-primary/50 transition-colors">
              <span className="font-mono text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-2 uppercase tracking-wider">
                <Cpu className="text-primary w-4 h-4" /> AI Computes
              </span>
              <div className="font-heading text-4xl font-extrabold text-white mt-auto">458k</div>
            </div>
          </div>

          {/* Metrics card 4 */}
          <div className="brutal-offset-container">
            <div className="brutal-offset-bg" />
            <div className="bg-surface p-6 flex flex-col h-full min-h-[130px] border border-white/10 relative overflow-hidden hover:border-primary/50 transition-colors">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-primary/5 pointer-events-none" />
              <span className="font-mono text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-2 uppercase tracking-wider">
                <Rocket className="text-primary w-4 h-4" /> Deployment Success
              </span>
              <div className="font-heading text-4xl font-extrabold text-white mt-auto">99.8%</div>
            </div>
          </div>
        </section>

        {/* SECTION 3: RECENT PROJECTS MATRIX GRID */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-heading text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Active Deployments Matrix
            </h2>
            <span className="font-mono text-xs text-on-surface-variant">
              Showing {recentProjects.length} projects
            </span>
          </div>

          {recentProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No Workspace Projects"
              description="Deploy your first autonomous AI team to start building web applications."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
