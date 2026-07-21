import type { Project, ProjectStatus } from '../../../../prisma/generated/prisma/client';

export type { Project, ProjectStatus };

export interface ProjectWithCounts extends Project {
  _count: { tasks: number };
}
