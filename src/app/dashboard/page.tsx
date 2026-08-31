import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthSession } from '@/lib/session-helper';
import {
  getDashboardStats,
  getRecentProjects,
} from '@/features/dashboard/services/dashboard.service';
import { ProjectCard } from '@/features/projects/components/project-card';
import { ROUTES } from '@/config/constants';
import { DashboardHeader } from '@/features/dashboard/components/dashboard-header';
import { ActiveProjectHero } from '@/features/dashboard/components/active-project-hero';
import { NeedsAttentionCard } from '@/features/dashboard/components/needs-attention-card';
import { AgentRosterGrid } from '@/features/dashboard/components/agent-roster-grid';
import { ArtifactOverviewCard } from '@/features/dashboard/components/artifact-overview-card';
import { EventTimelineCard } from '@/features/dashboard/components/event-timeline-card';
import { EmptyWorkspaceView } from '@/features/dashboard/components/empty-workspace-view';

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const [stats, recentProjects] = await Promise.all([
    getDashboardStats(userId),
    getRecentProjects(userId),
  ]);

  const activeProject = recentProjects[0] || null;
  const hasProjects = recentProjects.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-on-background overflow-y-auto">
      {/* Dashboard Overview Topbar */}
      <DashboardHeader userName={session.user.name} />

      {/* Main Content Area */}
      {!hasProjects ? (
        <EmptyWorkspaceView />
      ) : (
        <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-8 pb-16">
          {/* Active Project & Needs Attention Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ActiveProjectHero project={activeProject} />
            <NeedsAttentionCard project={activeProject} />
          </div>

          {/* YOUR AI TEAM Section */}
          <AgentRosterGrid />

          {/* ARTIFACT OVERVIEW & EVENT TIMELINE Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ArtifactOverviewCard />
            <EventTimelineCard />
          </div>

          {/* ALL WORKSPACE PROJECTS Grid */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                ALL WORKSPACE PROJECTS ({stats.totalProjects})
              </h3>
              <Link
                href={`${ROUTES.projects}/new`}
                className="font-mono text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>+ New Project</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
