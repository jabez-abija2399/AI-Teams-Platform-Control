import { describe, it, expect } from 'vitest';
import { ProductProposalEngine } from '../../src/core/product/proposal/product-proposal.engine';
import { ProposalScoreService } from '../../src/core/product/proposal/proposal-score.service';
import { DiscoveryApprovalService } from '../../src/core/discovery/approval.service';
import { ProductDiscoveryAgent } from '../../src/packages/agents/roles/product-discovery/product-discovery.agent';

describe('Phase 22 — Product Proposal Engine & Creator Experience', () => {
  it('1. Specification creates structured ProductProposal', async () => {
    const agent = new ProductDiscoveryAgent();
    const spec = await agent.discoverProductSpecification('I want a SaaS analytics dashboard');

    const proposal = ProductProposalEngine.generateProposal(spec, 'proj_saas_1');
    expect(proposal.productName).toBe('Want');
    expect(proposal.platform).toContain('Web');
    expect(proposal.aiTeam.length).toBeGreaterThanOrEqual(3);
  });

  it('2. Proposal contains MVP features breakdown', async () => {
    const agent = new ProductDiscoveryAgent();
    const spec = await agent.discoverProductSpecification('I want a todo app');

    const proposal = ProductProposalEngine.generateProposal(spec, 'proj_todo_1');
    expect(proposal.mvpFeatures.length).toBeGreaterThan(0);
    expect(proposal.mvpFeatures.some((f) => f.name.includes('Create tasks'))).toBe(true);
  });

  it('3. Quality score generated with clarity, features, and feasibility', async () => {
    const agent = new ProductDiscoveryAgent();
    const spec = await agent.discoverProductSpecification('I want an e-commerce store');

    const proposal = ProductProposalEngine.generateProposal(spec, 'proj_store_1');
    const score = ProposalScoreService.calculateScore(proposal);

    expect(score.clarity).toBeGreaterThan(50);
    expect(score.features).toBeGreaterThan(50);
    expect(score.feasibility).toBeGreaterThan(50);
    expect(score.overall).toBeGreaterThan(60);
  });

  it('4. Approval allows pipeline to continue', { timeout: 15000 }, async () => {
    const projectId = 'proj_approval_test';
    const agent = new ProductDiscoveryAgent();
    const spec = await agent.discoverProductSpecification('I want todo app');

    await DiscoveryApprovalService.createProposalApproval(projectId, spec);
    const initialStatus = await DiscoveryApprovalService.getApprovalStatus(projectId);
    expect(initialStatus).toBe('WAITING_FOR_APPROVAL');

    const approvedRes = await DiscoveryApprovalService.approveProject(projectId);
    expect(approvedRes.status).toBe('APPROVED');

    const finalStatus = await DiscoveryApprovalService.getApprovalStatus(projectId);
    expect(finalStatus).toBe('APPROVED');
  });

  it('5. Edit updates proposal features and recalculates quality score', async () => {
    const projectId = 'proj_edit_test';
    const agent = new ProductDiscoveryAgent();
    const spec = await agent.discoverProductSpecification('I want todo app');

    await DiscoveryApprovalService.createProposalApproval(projectId, spec);

    const updated = await DiscoveryApprovalService.updateProposal(projectId, {
      mvpFeatures: [
        { id: 'f1', name: 'Create task', description: 'Create new task', priority: 'HIGH' },
        { id: 'f2', name: 'Complete task', description: 'Mark task complete', priority: 'HIGH' },
        { id: 'f3', name: 'AI auto-prioritization', description: 'Priority sorting', priority: 'HIGH' },
      ],
    });

    expect(updated.proposal.mvpFeatures.some((f) => f.name === 'AI auto-prioritization')).toBe(true);
    expect(updated.score.overall).toBeGreaterThan(0);
  });
});
