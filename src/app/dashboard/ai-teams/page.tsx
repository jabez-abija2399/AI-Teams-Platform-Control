import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/session-helper';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ROUTES } from '@/config/constants';

// Import our new ultra-premium, feature-sliced UI components
import { AgentRoster, PipelineVisualizer } from '@/features/ai-dashboard';
import { NeonButton } from '@/packages/ui';
import { Bot } from 'lucide-react';

export default async function AITeamsPage() {
  // Ensure the user is authenticated
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');

  // Fetch the user's most recently active project to monitor
  const activeProject = await prisma.project.findFirst({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: 'desc' as any },
    select: { id: true, name: true },
  });

  // Empty state if the user has no projects
  if (!activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-surface-glass border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <Bot className="w-8 h-8 text-white/50" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">No active pipelines</h1>
        <p className="text-white/50 max-w-md mb-8">
          Create a project to awaken your AI company and watch them build your software in real-time.
        </p>
        <Link href={`${ROUTES.projects}/new`}>
          <NeonButton variant="primary">Initialize Project</NeonButton>
        </Link>
      </div>
    );
  }

  // The Premium Dashboard View
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Command Center</h1>
          <p className="text-sm text-white/50 flex items-center gap-2">
            Monitoring active AI pipeline for: 
            <span className="text-primary font-bold px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
              {activeProject.name}
            </span>
          </p>
        </div>
        
        <Link href={`${ROUTES.projects}/${activeProject.id}/workspace`}>
          <NeonButton variant="secondary">Enter Workspace</NeonButton>
        </Link>
      </div>

      {/* The Core Features Assembled */}
      <div className="flex flex-col gap-8">
        
        {/* 1. The Real-time SVG Pipeline Flow */}
        <PipelineVisualizer projectId={activeProject.id} />
        
        {/* 2. The 4-Agent Cascading Roster */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 tracking-tight">Active Roster</h3>
          <AgentRoster projectId={activeProject.id} />
        </div>
        
      </div>
      
    </div>
  );
}
