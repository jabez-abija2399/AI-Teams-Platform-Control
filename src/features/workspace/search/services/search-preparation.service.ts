import { prisma } from '@/lib/prisma';
import type { SearchResult, SearchProvider } from '../types/search.types';

export const quickSearchProvider: SearchProvider = {
  scope: 'quick',
  async search(query: string): Promise<SearchResult[]> {
    if (query.trim().length < 2) return [];

    const [projects, files] = await Promise.all([
      prisma.project.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: 5,
      }),
      prisma.file.findMany({
        where: { path: { contains: query, mode: 'insensitive' } },
        take: 5,
      }),
    ]);

    return [
      ...projects.map((p) => ({
        id: p.id,
        type: 'project' as const,
        label: p.name,
        path: `/dashboard/projects/${p.id}/workspace`,
      })),
      ...files.map((f) => ({
        id: f.id,
        type: 'file' as const,
        label: f.path.split('/').pop() ?? f.path,
        path: f.path,
      })),
    ];
  },
};
