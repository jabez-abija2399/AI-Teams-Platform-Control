import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { buildPreview } from '@/features/workspace/preview/services/preview-builder.service';
import { Sparkles, ArrowRight, Layers, Bot } from 'lucide-react';
import { ROUTES } from '@/config/constants';

export const metadata = {
  title: 'Live Preview | AI Teams Platform',
  description: 'Live standalone preview of your generated software project.',
};

export default async function ProjectPreviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  let projectName = 'Project Preview';
  let previewHtml: string | null = null;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, description: true, status: true },
    });
    if (project?.name) projectName = project.name;

    const preview = await buildPreview(projectId, {
      preferFast: true,
      skipConfirmation: true,
      smoke: false,
    });

    if (preview.type === 'HTML' && preview.html) {
      previewHtml = preview.html;
    } else if (preview.files) {
      // Check for direct index.html
      const indexCandidate = preview.files['index.html'] || preview.files['public/index.html'] || preview.files['src/index.html'];
      if (indexCandidate) {
        previewHtml = indexCandidate;
      }
    }
  } catch (err) {
    console.error('Error generating preview in ProjectPreviewPage:', err);
  }

  if (previewHtml) {
    return (
      <main className="h-screen w-screen m-0 p-0 overflow-hidden bg-background">
        <iframe
          srcDoc={previewHtml}
          className="h-full w-full border-none"
          title={`${projectName} Preview`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups allow-presentation"
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-screen flex-col items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_-15%,rgba(56,189,248,0.15),transparent_60%)]" />
      
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-md">
          <Sparkles className="h-6 w-6" />
        </div>

        <h1 className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl">
          {projectName}
        </h1>

        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          No previewable files built in this project yet. Your autonomous AI team is ready to plan, architect, and generate the code.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={`${ROUTES.projects}/${projectId}/workspace`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-all duration-200 hover:bg-sky-400"
          >
            <Bot className="h-4 w-4" />
            <span>Open Mission Control</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            href={ROUTES.projects}
            className="inline-flex w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            Back to Projects Portfolio
          </Link>
        </div>

        <div className="mt-6 border-t border-slate-800/80 pt-4">
          <p className="font-mono text-[10px] text-slate-500">
            Project ID: <span className="text-sky-400">{projectId}</span>
          </p>
        </div>
      </div>
    </main>
  );
}
