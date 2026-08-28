import { prisma } from '@/lib/prisma';
import { buildPreview } from '@/features/workspace/preview/services/preview-builder.service';
import { PreviewSandboxShell } from '@/features/workspace/preview/components/preview-sandbox-shell';

export const metadata = {
  title: 'Live Preview Sandbox | AI Teams Platform',
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
      const indexCandidate =
        preview.files['index.html'] ||
        preview.files['public/index.html'] ||
        preview.files['src/index.html'];
      if (indexCandidate) {
        previewHtml = indexCandidate;
      }
    }
  } catch (err) {
    console.error('Error generating preview in ProjectPreviewPage:', err);
  }

  return (
    <PreviewSandboxShell
      projectId={projectId}
      projectName={projectName}
      previewHtml={previewHtml}
    />
  );
}
