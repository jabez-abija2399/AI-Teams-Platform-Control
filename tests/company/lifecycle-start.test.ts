import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectLifecycleService } from '@/core/company-orchestration';
import { prisma } from '@/lib/prisma';
import { getProject } from '@/features/projects/services/project.service';

describe('Pipeline Start & Project Resilience', () => {
  const testOwnerId = 'test-owner-123';
  const testProjectId = 'cmt62tfvn000004l5y3s8ap1a';

  beforeEach(async () => {
    await prisma.user.upsert({
      where: { id: testOwnerId },
      create: {
        id: testOwnerId,
        email: 'tester@aiteams.com',
        name: 'Tester',
      },
      update: {},
    });
  });

  it('1. getProject auto-persists project so it exists in database', async () => {
    const project = await getProject(testProjectId, testOwnerId);
    expect(project).toBeDefined();
    expect(project.id).toBe(testProjectId);

    const dbRecord = await prisma.project.findUnique({
      where: { id: testProjectId },
    });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.id).toBe(testProjectId);
  });

  it('2. startLifecycle starts pipeline without "Project not found" error', async () => {
    const freshProjectId = 'cmt999freshprojectid';
    const result = await ProjectLifecycleService.startLifecycle(
      freshProjectId,
      'Build a modern SaaS landing page',
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBe(freshProjectId);
      expect(result.data.currentPhase).toBe('DISCOVERY_RUNNING');
    }

    const createdProject = await prisma.project.findUnique({
      where: { id: freshProjectId },
    });
    expect(createdProject).not.toBeNull();
  });
});
