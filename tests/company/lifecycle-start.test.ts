import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectLifecycleService } from '@/core/company-orchestration';
import { prisma } from '@/lib/prisma';
import { createProject, getProject } from '@/features/projects/services/project.service';

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

  it('1. createProject persists authentic project name, description and stack', async () => {
    const created = await createProject(testOwnerId, {
      name: 'Custom SaaS Billing Platform',
      description: 'A full subscription billing portal with invoice downloads',
      stack: 'nextjs',
    });

    expect(created.success).toBe(true);
    if (created.success) {
      expect(created.data.name).toBe('Custom SaaS Billing Platform');
      expect(created.data.description).toBe('A full subscription billing portal with invoice downloads');
      expect(created.data.selectedStackId).toBe('nextjs-fullstack-v1');

      const fetched = await getProject(created.data.id, testOwnerId);
      expect(fetched).not.toBeNull();
      expect(fetched?.name).toBe('Custom SaaS Billing Platform');
    }
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
