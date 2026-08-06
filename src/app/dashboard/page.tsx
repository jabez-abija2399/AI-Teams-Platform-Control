import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthSession } from '@/lib/session-helper';
import {
  getDashboardStats,
  getRecentProjects,
} from '@/features/dashboard/services/dashboard.service';
import { StatCard } from '@/features/dashboard/components/stat-card';
import { RecentActivity } from '@/features/dashboard/components/recent-activity';
import { QuickActions } from '@/features/dashboard/components/quick-actions';
import { ProjectCard } from '@/features/projects/components/project-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageContainer } from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';
import { FolderKanban, ListTodo, Rocket, Plus, ArrowRight } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;
  const firstName = session.user.name?.split(' ')[0] ?? 'there';

  const [stats, recentProjects] = await Promise.all([
    getDashboardStats(userId),
    getRecentProjects(userId),
  ]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back, {firstName}</p>
          <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Overview of your AI software companies, pipeline activity, and next actions.
          </p>
        </div>
        <Link
          href={`${ROUTES.projects}/new`}
          className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 rounded-xl shadow-sm')}
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total projects"
          value={stats.totalProjects}
          icon={FolderKanban}
          hint="All AI companies you own"
        />
        <StatCard
          label="Active projects"
          value={stats.activeProjects}
          icon={Rocket}
          hint="Currently building"
        />
        <StatCard
          label="Total tasks"
          value={stats.totalTasks}
          icon={ListTodo}
          hint="Across all pipelines"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Recent projects</h2>
            <Link
              href={ROUTES.projects}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project and launch an AI software company."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {recentProjects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <QuickActions />
          <RecentActivity activities={stats.recentActivity} />
        </div>
      </div>
    </PageContainer>
  );
}
