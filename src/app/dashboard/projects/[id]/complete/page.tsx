import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getAuthSession } from '@/lib/session-helper';
import { getProject } from '@/features/projects/services/project.service';
import { prisma } from '@/lib/prisma';
import { ROUTES } from '@/config/constants';
import {
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Package,
  Brain,
  Layers,
  Sparkles,
  Terminal,
  Code2,
} from 'lucide-react';
import { DeploymentPanel } from '@/features/deployment/components/deployment-panel';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Project Complete · ${id.slice(-6).toUpperCase()} | HibirDev AI` };
}

export default async function ProjectCompletePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');

  let project;
  try {
    project = await getProject(id, session.user.id);
  } catch {
    throw new Error('Could not load project');
  }
  if (!project || project.status !== 'COMPLETED') {
    redirect(`${ROUTES.projects}/${id}/workspace`);
  }

  // Fetch artifacts for this project
  const artifactRecords = await prisma.artifactLifecycleRecord.findMany({
    where: { projectId: id },
    orderBy: { createdAt: 'desc' },
    take: 12,
  });

  const artifacts = artifactRecords.map((art) => ({
    id: art.id,
    name: art.contentSummary || art.artifactType,
    type: art.artifactType,
  }));

  const agentPipeline = [
    { label: 'CEO', icon: Brain, artifact: 'Product Specification' },
    { label: 'ARCHITECT', icon: Layers, artifact: 'Architecture Specification' },
    { label: 'DESIGNER', icon: Sparkles, artifact: 'Design Specification' },
    { label: 'DEVELOPER', icon: Terminal, artifact: 'Implementation Deliverable' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto flex flex-col gap-8">
      {/* ── Hero ── */}
      <div className="border border-outline-variant/60 bg-surface-container-low p-6 md:p-8 relative overflow-hidden rounded-sm">
        {/* Blueprint bg */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(60,73,73,0.5) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(60,73,73,0.5) 0.5px, transparent 0.5px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-success/30 bg-success/10 shrink-0">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 border border-success/20 bg-success/5 px-2.5 py-0.5 rounded-sm mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="font-mono text-[10px] font-bold text-success uppercase tracking-wider">
                  BUILD COMPLETE
                </span>
              </div>
              <h1 className="font-sans text-2xl md:text-3xl font-bold text-on-surface">
                {project.name}
              </h1>
              <p className="font-sans text-sm text-on-surface-variant mt-1 max-w-lg">
                {project.description || 'Your AI company has finished building this project.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href={`${ROUTES.projects}/${id}/workspace`}>
              <button
                type="button"
                className="bg-primary text-black font-mono text-xs font-bold px-4 py-2 rounded-sm hover:bg-primary-container transition-colors flex items-center gap-1.5"
              >
                <Code2 className="w-3.5 h-3.5" />
                Open Studio
              </button>
            </Link>
            <Link href={`${ROUTES.projects}/${id}`}>
              <button
                type="button"
                className="font-mono text-xs text-on-surface-variant border border-outline-variant/60 px-4 py-2 rounded-sm hover:border-primary hover:text-primary transition-colors flex items-center gap-1.5"
              >
                Overview
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Agent Pipeline Summary ── */}
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
          Build Pipeline — All Phases Complete
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {agentPipeline.map(({ label, icon: Icon, artifact: artifactLabel }) => (
            <div
              key={label}
              className="border border-outline-variant/60 bg-surface-container-low p-4 rounded-sm flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-4 h-4 text-primary" />
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              </div>
              <p className="font-mono text-xs font-bold text-on-surface uppercase">{label}</p>
              <p className="font-mono text-[10px] text-on-surface-variant">{artifactLabel}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Artifacts ── */}
      {artifacts.length > 0 && (
        <div className="border border-outline-variant/60 bg-surface-container-low rounded-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-outline-variant/60">
            <Package className="w-3.5 h-3.5 text-primary" />
            <p className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Generated Artifacts ({artifacts.length})
            </p>
          </div>
          <div className="divide-y divide-outline-variant/40">
            {artifacts.map((artifact) => (
              <div
                key={artifact.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-container transition-colors"
              >
                <div>
                  <p className="font-sans text-xs font-medium text-on-surface">{artifact.name}</p>
                  <p className="font-mono text-[10px] text-on-surface-variant uppercase mt-0.5">
                    {artifact.type?.replace(/_/g, ' ') ?? 'ARTIFACT'}
                  </p>
                </div>
                <Link
                  href={`${ROUTES.projects}/${id}/workspace`}
                  className="font-mono text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  View <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Deployment ── */}
      <div className="flex flex-col gap-3">
        <p className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
          Deploy Your Application
        </p>
        <div className="border border-outline-variant/60 bg-surface-container-low rounded-sm overflow-hidden min-h-[200px]">
          <DeploymentPanel projectId={id} />
        </div>
      </div>
    </div>
  );
}
