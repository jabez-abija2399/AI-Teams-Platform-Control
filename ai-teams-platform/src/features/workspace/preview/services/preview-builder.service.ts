import { prisma } from '@/lib/prisma';

export interface PreviewResult {
  type: 'HTML' | 'UNSUPPORTED';
  html?: string;
  reason?: string;
}

export async function buildPreview(projectId: string): Promise<PreviewResult> {
  const repository = await prisma.repository.findUnique({
    where: { projectId },
    include: { files: true },
  });
  if (!repository || repository.files.length === 0) {
    return { type: 'UNSUPPORTED', reason: 'No generated files yet.' };
  }

  const htmlFile = repository.files.find((f) => f.path.endsWith('.html') || f.path === 'index.html');
  if (htmlFile) {
    const cssFile = repository.files.find((f) => f.path.endsWith('.css'));
    const jsFile = repository.files.find((f) => f.path.endsWith('.js') && !f.path.includes('config'));

    const html = htmlFile.content
      .replace('</head>', `${cssFile ? `<style>${cssFile.content}</style>` : ''}</head>`)
      .replace('</body>', `${jsFile ? `<script>${jsFile.content}</script>` : ''}</body>`);

    return { type: 'HTML', html };
  }

  return {
    type: 'UNSUPPORTED',
    reason:
      "This project needs a full build step to preview — Next.js/React apps with routing can't run in a static preview yet.",
  };
}
