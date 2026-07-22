import { prisma } from '@/lib/prisma';

export async function listSamples() {
  return prisma.sampleProject.findMany({ orderBy: [{ featured: 'desc' }, { title: 'asc' }] });
}
