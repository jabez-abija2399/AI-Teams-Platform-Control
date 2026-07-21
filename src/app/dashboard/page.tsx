import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
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
import { FolderKanban, ListTodo, Rocket } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const userId = session.user.id;

  const [stats, recentProjects] = await Promise.all([
    getDashboardStats(userId),
    getRecentProjects(userId),
  ]);

  return (
    <PageContainer>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Overview of your projects and activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total projects" value={stats.totalProjects} icon={FolderKanban} />
        <StatCard label="Active projects" value={stats.activeProjects} icon={Rocket} />
        <StatCard label="Total tasks" value={stats.totalTasks} icon={ListTodo} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-sm font-medium">Recent projects</h2>
          {recentProjects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project to get started."
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
