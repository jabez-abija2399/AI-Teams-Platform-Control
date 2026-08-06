import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkProjectAccess } from '@/lib/project-access';
import { prisma } from '@/lib/prisma';

describe('checkProjectAccess', () => {
  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE projects, users CASCADE`;
  });

  afterEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE projects, users CASCADE`;
  });

  it('should deny access for non-existent project', async () => {
    const result = await checkProjectAccess('non-existent-id', 'user-1');
    expect(result.hasAccess).toBe(false);
  });

  it('should allow access for project owner', async () => {
    const user = await prisma.user.create({
      data: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
    });

    await prisma.project.create({
      data: { id: 'proj-1', name: 'Test Project', ownerId: user.id },
    });

    const result = await checkProjectAccess('proj-1', 'user-1');
    expect(result.hasAccess).toBe(true);
    expect(result.role).toBe('owner');
  });

  it('should deny access for non-owner user', async () => {
    const owner = await prisma.user.create({
      data: { id: 'user-1', name: 'Owner', email: 'owner@example.com' },
    });
    const otherUser = await prisma.user.create({
      data: { id: 'user-2', name: 'Other', email: 'other@example.com' },
    });

    await prisma.project.create({
      data: { id: 'proj-1', name: 'Test Project', ownerId: owner.id },
    });

    const result = await checkProjectAccess('proj-1', 'user-2');
    expect(result.hasAccess).toBe(false);
  });

  it('should allow access via organization membership', async () => {
    const owner = await prisma.user.create({
      data: { id: 'user-1', name: 'Owner', email: 'owner@example.com' },
    });
    const member = await prisma.user.create({
      data: { id: 'user-2', name: 'Member', email: 'member@example.com' },
    });

    const org = await prisma.organization.create({
      data: { id: 'org-1', name: 'Test Org', slug: 'test-org', ownerId: owner.id },
    });

    await prisma.project.create({
      data: { id: 'proj-1', name: 'Test Project', ownerId: owner.id, organizationId: org.id },
    });

    await prisma.membership.create({
      data: { organizationId: org.id, userId: member.id, type: 'MEMBER', role: 'MEMBER' },
    });

    const result = await checkProjectAccess('proj-1', 'user-2');
    expect(result.hasAccess).toBe(true);
    expect(result.role).toBe('MEMBER');
  });
});