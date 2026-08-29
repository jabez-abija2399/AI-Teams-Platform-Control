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
import { Search, Plus, SlidersHorizontal, FolderKanban, Terminal, Code2, Cpu, Rocket } from 'lucide-react';

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
            <h1 className="font-heading text-3xl font-bold text-on-background mb-1">AI Portfolio Matrix</h1>
            <p className="font-mono text-xs text-on-surface-variant">Global overview of managed orchestration projects.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative brutal-border flex-1 md:w-64 bg-surface flex items-center px-3 border border-white/10">
              <Search className="text-on-surface-variant w-4 h-4 mr-2" />
              <input
                className="w-full bg-transparent border-none text-on-background font-mono text-xs py-2.5 focus:outline-none focus:ring-0 placeholder:text-on-surface-variant/50"
                placeholder="QUERY PROJECTS..."
                type="text"
              />
            </div>
            <button className="bg-surface border border-white/10 text-on-surface p-2.5 hover:bg-surface-container transition-colors flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-on-surface-variant" />
            </button>
            <Link href={`${ROUTES.projects}/new`}>
              <button className="bg-primary text-background font-mono text-xs font-bold px-6 py-3 border border-transparent hover:border-primary hover:bg-transparent hover:text-primary transition-all flex items-center gap-2 whitespace-nowrap uppercase tracking-wider">
                <Plus className="w-4 h-4" />
                LAUNCH NEW BUILD
              </button>
            </Link>
          </div>
        </header>

        {/* SECTION 2: TOP METRICS BAR */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Metrics card 1 */}
          <div className="brutal-offset-container">
            <div className="brutal-offset-bg"></div>
            <div className="brutal-border bg-surface p-6 flex flex-col h-full min-h-[120px] border border-white/10">
              <span className="font-mono text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-2 uppercase">
                <FolderKanban className="text-primary w-4 h-4" /> ACTIVE PROJECTS
              </span>
              <div className="font-heading text-4xl font-bold text-primary mt-auto">{stats.totalProjects}</div>
            </div>
          </div>

          {/* Metrics card 2 */}
          <div className="brutal-offset-container">
            <div className="brutal-offset-bg"></div>
            <div className="brutal-border bg-surface p-6 flex flex-col h-full min-h-[120px] border border-white/10">
              <span className="font-mono text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-2 uppercase">
                <Code2 className="text-primary w-4 h-4" /> CODEBASE LINES
              </span>
              <div className="font-heading text-4xl font-bold text-white mt-auto">1.2M</div>
            </div>
          </div>

          {/* Metrics card 3 */}
          <div className="brutal-offset-container">
            <div className="brutal-offset-bg"></div>
            <div className="brutal-border bg-surface p-6 flex flex-col h-full min-h-[120px] border border-white/10">
              <span className="font-mono text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-2 uppercase">
                <Cpu className="text-primary w-4 h-4" /> AI COMPUTES
              </span>
              <div className="font-heading text-4xl font-bold text-white mt-auto">458k</div>
            </div>
          </div>

          {/* Metrics card 4 */}
          <div className="brutal-offset-container">
            <div className="brutal-offset-bg"></div>
            <div className="brutal-border bg-surface p-6 flex flex-col h-full min-h-[120px] border border-white/10 relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-primary/5 pointer-events-none"></div>
              <span className="font-mono text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-2 uppercase">
                <Rocket className="text-primary w-4 h-4" /> DEPLOYMENT SUCCESS
              </span>
              <div className="font-heading text-4xl font-bold text-white mt-auto">99.8%</div>
            </div>
          </div>
        </section>

        {/* SECTION 3: PORTFOLIO GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentProjects.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Launch your first AI build workspace and start orchestrating."
              />
            </div>
          ) : (
            recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </section>
      </div>
    </div>
  );
}
