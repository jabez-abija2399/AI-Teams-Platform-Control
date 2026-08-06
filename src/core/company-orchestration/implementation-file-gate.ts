/**
 * Durable Explorer file evidence for Development — never trust self-attested flags.
 */

import { prisma } from '@/lib/prisma';

export function isStubOnlyPath(path: string): boolean {
  return /^(package\.json|tsconfig\.json|README\.md|\.gitignore|vite\.config\.(ts|js)|next\.config\.(ts|js|mjs))$/i.test(
    path.replace(/^\.\//, ''),
  );
}

export function isAppEntryPath(path: string): boolean {
  const p = path.replace(/^\.\//, '');
  return (
    /\.(html)$/i.test(p) ||
    /(^|\/)(page|App|main|index)\.(tsx|jsx|ts|js)$/i.test(p) ||
    /(^|\/)src\/app\//i.test(p) ||
    /(^|\/)app\/page\./i.test(p)
  );
}

export interface ProjectFileEvidence {
  fileCount: number;
  realFileCount: number;
  hasAppEntry: boolean;
  paths: string[];
  ok: boolean;
  message?: string;
}

export async function getProjectFileEvidence(projectId: string): Promise<ProjectFileEvidence> {
  const repo = await prisma.repository.findUnique({
    where: { projectId },
    include: { files: { select: { path: true }, take: 500 } },
  });
  const paths = (repo?.files ?? []).map((f) => f.path);
  const fileCount = paths.length;
  const realPaths = paths.filter((p) => !isStubOnlyPath(p));
  const realFileCount = realPaths.length;
  const hasAppEntry = paths.some(isAppEntryPath);
  const ok = realFileCount >= 1 && hasAppEntry;

  return {
    fileCount,
    realFileCount,
    hasAppEntry,
    paths,
    ok,
    message: ok
      ? undefined
      : fileCount === 0
        ? 'No Explorer files for this project. Resume Development to generate them.'
        : !hasAppEntry
          ? 'Explorer has stubs only — no app entry (HTML/page/App). Resume Development to generate real files.'
          : 'Development files incomplete. Resume to regenerate.',
  };
}

/** Hard stop before marking Development / COMPLETED done. */
export async function assertProjectHasImplementationFiles(
  projectId: string,
): Promise<{ ok: true; evidence: ProjectFileEvidence } | { ok: false; message: string; evidence: ProjectFileEvidence }> {
  const evidence = await getProjectFileEvidence(projectId);
  if (!evidence.ok) {
    return {
      ok: false,
      message: evidence.message || 'Missing implementation files',
      evidence,
    };
  }
  return { ok: true, evidence };
}

export function deliverableListsFiles(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  const rec = data as Record<string, unknown>;
  const impl = (rec.implementation || rec) as Record<string, unknown>;
  const changes = (impl.changes || rec.changes || rec.files) as unknown;
  if (Array.isArray(changes)) return changes.length;
  return 0;
}
