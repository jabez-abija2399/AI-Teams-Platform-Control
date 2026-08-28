import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { CollaborationManager } from '../../src/core/execution-engine/collaboration.manager';
import { AgentRole } from '../../src/packages/agents/core/agent.types';

describe('Phase 19 - Collaboration System', () => {
  const projectId = `proj-collab-${Date.now()}`;
  const manager = new CollaborationManager();

  beforeAll(async () => {
    await prisma.agentDecision.deleteMany({});
    const user = await prisma.user.create({
      data: { email: `collab-${Date.now()}@example.com`, name: 'Collab User' }
    });
    
    await prisma.project.create({
      data: { id: projectId, name: 'Collab Test', ownerId: user.id }
    });
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } });
  });

  it('should store and retrieve agent messages', async () => {
    await manager.broadcastMessage(projectId, 'ARCHITECT', 'Database requires PostgreSQL.');
    await manager.broadcastMessage(projectId, 'FRONTEND', 'Waiting for API schema.', ['BACKEND']);
    
    const messages = await manager.getRecentContext(projectId);
    
    expect(messages.length).toBe(2);
    const m0 = messages[0];
    const m1 = messages[1];

    expect(m0).toBeDefined();
    expect(m0?.from).toBe('ARCHITECT');
    expect(m0?.message).toBe('Database requires PostgreSQL.');
    
    expect(m1).toBeDefined();
    expect(m1?.from).toBe('FRONTEND');
    expect(m1?.to).toBe('BACKEND');
    expect(m1?.message).toBe('Waiting for API schema.');
  });

  it('should store and retrieve agent decisions', async () => {
    await manager.recordDecision(
      projectId,
      'ARCHITECT',
      'Use PostgreSQL because relational inventory data.',
      'Backend data layer design'
    );

    const decisions = await manager.getDecisions(projectId);
    expect(decisions.length).toBe(1);
    const d0 = decisions[0];
    expect(d0).toBeDefined();
    expect(d0?.agentId).toBe('ARCHITECT');
    expect(d0?.decision).toBe('Use PostgreSQL because relational inventory data.');
    expect(d0?.outcome).toBe('Backend data layer design');
  });
});
