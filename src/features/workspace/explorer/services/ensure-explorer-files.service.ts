/**
 * Inspect Explorer for a project. By default does NOT invent scaffold files —
 * inventing fake demos caused "wrong project" / false-complete confusion.
 * Pass inventIfEmpty: true only from explicit admin/heal tools if needed.
 */

import { prisma } from '@/lib/prisma';
import {
  buildHeuristicImplementation,
  getLanguageFromPath,
} from '@/ai/agents/roles/developer/developer.service';
import { syncFilesToWorkspace } from '@/features/workspace/explorer/services/workspace-sync.service';
import { resolveStackFromMemory } from '@/core/memory/persist-stack-constraints';
import { ArtifactManager } from '@/core/company-orchestration/artifact-manager';
import {
  getProjectFileEvidence,
  isStubOnlyPath,
} from '@/core/company-orchestration/implementation-file-gate';

export interface EnsureExplorerResult {
  synced: boolean;
  reason: string;
  fileCount: number;
  projectId: string;
  stack?: string;
  needsDevelopment?: boolean;
}

export async function ensureProjectExplorerFiles(
  projectId: string,
  opts?: { inventIfEmpty?: boolean },
): Promise<EnsureExplorerResult> {
  if (!projectId || projectId === 'undefined' || projectId === 'null') {
    return { synced: false, reason: 'invalid_project', fileCount: 0, projectId };
  }

  const inventIfEmpty = opts?.inventIfEmpty === true;
  const evidence = await getProjectFileEvidence(projectId);
  const stack = await resolveStackFromMemory(projectId);

  if (evidence.ok) {
    return {
      synced: false,
      reason: 'already_populated',
      fileCount: evidence.fileCount,
      projectId,
      stack: stack.label,
      needsDevelopment: false,
    };
  }

  // Default: report empty — let Resume / Developer agent create real files
  if (!inventIfEmpty) {
    return {
      synced: false,
      reason: 'empty_awaiting_development',
      fileCount: evidence.fileCount,
      projectId,
      stack: stack.label,
      needsDevelopment: true,
    };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, description: true },
  });

  let architectureInput: unknown = {
    projectName: project?.name || 'Generated App',
    title: project?.name || 'Generated App',
    overview: { title: project?.description || project?.name },
  };

  try {
    const art = await ArtifactManager.getLatestArtifact(projectId, 'ArchitectureDocument');
    if (art.success && art.data) {
      architectureInput = art.data;
    }
  } catch {
    /* heuristic with name is fine */
  }

  const heuristic = buildHeuristicImplementation(architectureInput, undefined, stack);
  const files = heuristic.changes
    .filter((c) => !isStubOnlyPath(c.file) || heuristic.changes.length <= 3)
    .map((c) => ({
      path: c.file,
      content: c.code,
      language: getLanguageFromPath(c.file),
    }));

  await syncFilesToWorkspace(projectId, files);

  return {
    synced: true,
    reason: 'invented_scaffold',
    fileCount: files.length,
    projectId,
    stack: stack.label,
    needsDevelopment: false,
  };
}
