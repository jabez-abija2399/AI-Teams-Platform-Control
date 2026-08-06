/**
 * Persist / load architecture delivery todos for Mission Control + Developer.
 */

import { prisma } from '@/lib/prisma';
import {
  architectureDeliveryPlanSchema,
  type ArchitectureDeliveryPlan,
  type ImplementationTodo,
  type QaTodo,
  summarizeTodoProgress,
} from './architecture-delivery-plan';

const DOC_TYPE = 'IMPLEMENTATION_TODOS';

export async function persistDeliveryPlan(
  projectId: string,
  plan: ArchitectureDeliveryPlan,
): Promise<void> {
  const content = JSON.stringify(architectureDeliveryPlanSchema.parse(plan));
  await prisma.document.deleteMany({ where: { projectId, type: DOC_TYPE } });
  await prisma.document.create({
    data: {
      projectId,
      type: DOC_TYPE,
      title: 'Implementation Todos',
      content,
      author: 'Architect AI',
    },
  });
}

export async function loadDeliveryPlan(
  projectId: string,
): Promise<ArchitectureDeliveryPlan | null> {
  const doc = await prisma.document.findFirst({
    where: { projectId, type: DOC_TYPE },
    orderBy: { createdAt: 'desc' },
  });
  if (!doc?.content) return null;
  try {
    return architectureDeliveryPlanSchema.parse(JSON.parse(doc.content));
  } catch {
    return null;
  }
}

export async function updateImplementationTodos(
  projectId: string,
  todos: ImplementationTodo[],
  qaTodos?: QaTodo[],
): Promise<ArchitectureDeliveryPlan> {
  const existing = (await loadDeliveryPlan(projectId)) || {
    fileStructure: [],
    implementationTodos: [],
    qaTodos: [],
  };
  const next = architectureDeliveryPlanSchema.parse({
    ...existing,
    implementationTodos: todos,
    qaTodos: qaTodos ?? existing.qaTodos,
  });
  await persistDeliveryPlan(projectId, next);
  return next;
}

export function progressFromPlan(plan: ArchitectureDeliveryPlan | null) {
  if (!plan) return { total: 0, done: 0, failed: 0, pending: 0, percent: 0 };
  const s = summarizeTodoProgress(plan.implementationTodos);
  return {
    ...s,
    percent: s.total === 0 ? 0 : Math.round((s.done / s.total) * 100),
  };
}
