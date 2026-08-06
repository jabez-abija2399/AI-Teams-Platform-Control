/**
 * Ensure Explorer has real app files for a project (stack-aware backfill).
 * Used by Studio open, pipeline complete, and heal paths — one place only.
 */

import { prisma } from '@/lib/prisma';
import {
  buildHeuristicImplementation,
  getLanguageFromPath,
} from '@/ai/agents/roles/developer/developer.service';
import { syncFilesToWorkspace } from '@/features/workspace/explorer/services/workspace-sync.service';
import { resolveStackFromMemory } from '@/core/memory/persist-stack-constraints';
import { ArtifactManager } from '@/core/company-orchestration/artifact-manager';

export interface EnsureExplorerResult {
  synced: boolean;
  reason: string;
  fileCount: number;
  projectId: string;
  stack?: string;
}

function isStubPath(path: string): boolean {
  return /^(package\.json|tsconfig\.json|README\.md|\.gitignore)$/i.test(path);
}

/**
 * Materialize Explorer files when missing or when stack files are absent
 * (e.g. Complete with empty repo, or HTML stack but only Next stubs).
 */
export async function ensureProjectExplorerFiles(
  projectId: string,
): Promise<EnsureExplorerResult> {
  if (!projectId || projectId === 'undefined' || projectId === 'null') {
    return { synced: false, reason: 'invalid_project', fileCount: 0, projectId };
  }

  const repo = await prisma.repository.findUnique({
    where: { projectId },
    include: {
      files: { select: { id: true, path: true }, take: 200 },
    },
  });

  const paths = (repo?.files ?? []).map((f) => f.path);
  const fileCount = paths.length;
  const onlyStubs = fileCount > 0 && fileCount <= 3 && paths.every(isStubPath);
  const hasHtml = paths.some((p) => p.toLowerCase().endsWith('.html'));
  const hasAppEntry = paths.some(
    (p) =>
      /(^|\/)(page|App|main)\.(tsx|jsx|ts|js)$/i.test(p) ||
      p.includes('src/app/') ||
      p.startsWith('app/'),
  );

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, description: true },
  });

  const stack = await resolveStackFromMemory(projectId, project?.name, project?.description);

  const needsHtmlBackfill = stack.htmlCss === true && !hasHtml;
  const needsAppBackfill =
    !stack.htmlCss && fileCount > 0 && !onlyStubs && !hasAppEntry && !hasHtml;
  const emptyOrStubs = fileCount === 0 || onlyStubs;

  if (!emptyOrStubs && !needsHtmlBackfill && !needsAppBackfill) {
    return {
      synced: false,
      reason: 'already_populated',
      fileCount,
      projectId,
      stack: stack.label,
    };
  }

  let architectureInput: unknown = {
    projectName: project?.name || 'Generated App',
    title: project?.name || 'Generated App',
    overview: { title: project?.description || project?.name },
  };

  try {
    const art = await ArtifactManager.getLatestArtifact(projectId, 'ArchitectureDocument');
    if (art.success && art.data) {
      architectureInput = art.data;
    } else {
      const sysArch = await prisma.document.findFirst({
        where: { projectId, type: 'SYSTEM_ARCHITECTURE' },
        orderBy: { createdAt: 'desc' },
      });
      if (sysArch?.content) {
        try {
          architectureInput = {
            architecture: JSON.parse(sysArch.content),
            title: project?.name,
          };
        } catch {
          /* keep default */
        }
      }
    }
  } catch {
    /* heuristic with name is fine */
  }

  const heuristic = buildHeuristicImplementation(architectureInput, undefined, stack);

  await syncFilesToWorkspace(
    projectId,
    heuristic.changes.map((c) => ({
      path: c.file,
      content: c.code,
      language: getLanguageFromPath(c.file),
    })),
  );

  return {
    synced: true,
    reason: needsHtmlBackfill
      ? 'stack_html_backfill'
      : emptyOrStubs
        ? 'empty_or_stubs'
        : 'missing_app_entry',
    fileCount: heuristic.changes.length,
    projectId,
    stack: stack.label,
  };
}
