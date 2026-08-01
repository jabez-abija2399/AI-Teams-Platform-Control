import { describe, it, expect } from 'vitest';
import { ArchitectureProposalEngine } from '../../src/core/architecture/proposal/architecture-proposal.engine';
import { ArchitectureScoreService } from '../../src/core/architecture/proposal/architecture-score.service';
import { ArchitectureApprovalService } from '../../src/core/architecture/architecture-approval.service';

describe('Phase 23 — Architecture Decision & Approval System', () => {
  it('1. Architect output creates structured ArchitectureProposal', () => {
    const output = {
      frontendFramework: 'Next.js 14 App Router',
      backendFramework: 'Node.js Express TypeScript Service',
      databaseTech: 'PostgreSQL 16',
      orm: 'Prisma ORM',
    };

    const proposal = ArchitectureProposalEngine.generateProposal(output, 'proj_arch_1');
    expect(proposal.frontend.framework).toContain('Next.js 14');
    expect(proposal.database.technology).toBe('PostgreSQL 16');
    expect(proposal.decisions.length).toBeGreaterThan(0);
  });

  it('2. Quality scores generated (scalability, security, maintainability, complexity)', () => {
    const proposal = ArchitectureProposalEngine.generateProposal({}, 'proj_arch_2');
    const scores = ArchitectureScoreService.calculateScore(proposal);

    expect(scores.scalability).toBeGreaterThan(70);
    expect(scores.security).toBeGreaterThan(70);
    expect(scores.maintainability).toBeGreaterThan(70);
    expect(scores.overall).toBeGreaterThan(75);
  });

  it('3. Unapproved request sets status to WAITING_FOR_ARCHITECTURE_APPROVAL', async () => {
    const projectId = 'proj_arch_pause_test';
    const res = await ArchitectureApprovalService.createApprovalRequest(projectId, {});

    expect(res.status).toBe('WAITING_FOR_ARCHITECTURE_APPROVAL');

    const currentStatus = await ArchitectureApprovalService.getApprovalStatus(projectId);
    expect(currentStatus).toBe('WAITING_FOR_ARCHITECTURE_APPROVAL');
  });

  it('4. Approving architecture sets status to ARCHITECTURE_APPROVED', async () => {
    const projectId = 'proj_arch_approve_test';
    await ArchitectureApprovalService.createApprovalRequest(projectId, {});

    const approvedRes = await ArchitectureApprovalService.approveArchitecture(projectId);
    expect(approvedRes.status).toBe('ARCHITECTURE_APPROVED');

    const finalStatus = await ArchitectureApprovalService.getApprovalStatus(projectId);
    expect(finalStatus).toBe('ARCHITECTURE_APPROVED');
  });

  it('5. Rejecting architecture sets status to ARCHITECTURE_REJECTED', async () => {
    const projectId = 'proj_arch_reject_test';
    await ArchitectureApprovalService.createApprovalRequest(projectId, {});

    const rejectedRes = await ArchitectureApprovalService.rejectArchitecture(projectId);
    expect(rejectedRes.status).toBe('ARCHITECTURE_REJECTED');

    const finalStatus = await ArchitectureApprovalService.getApprovalStatus(projectId);
    expect(finalStatus).toBe('ARCHITECTURE_REJECTED');
  });

  it('6. Updating architecture proposal modifies configuration and recalculates scores', async () => {
    const projectId = 'proj_arch_update_test';
    await ArchitectureApprovalService.createApprovalRequest(projectId, {});

    const updated = await ArchitectureApprovalService.updateArchitecture(projectId, {
      architecturePattern: 'Event-Driven Microservices Architecture',
      deployment: { provider: 'AWS ECS Fargate Cluster' },
    });

    expect(updated.proposal.architecturePattern).toBe('Event-Driven Microservices Architecture');
    expect(updated.proposal.deployment.provider).toBe('AWS ECS Fargate Cluster');
    expect(updated.scores.overall).toBeGreaterThan(0);
  });
});
