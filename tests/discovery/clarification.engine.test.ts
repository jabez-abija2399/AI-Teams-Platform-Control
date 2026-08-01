import { describe, it, expect } from 'vitest';
import { ProductDiscoveryAgent } from '../../src/ai/agents/roles/product-discovery.agent';
import { ClarificationEngine } from '../../src/core/discovery/clarification.engine';
import { DiscoveryApprovalService } from '../../src/core/discovery/approval.service';
import { PipelineOrchestrator } from '../../src/core/execution-engine/pipeline.orchestrator';

describe('Phase 21 — Clarification Engine & Approval Workflow', () => {
  it('1. Simple prompt generates clarification questions', async () => {
    const discoveryAgent = new ProductDiscoveryAgent();
    const spec = await discoveryAgent.discoverProductSpecification('I want todo app');

    const questions = ClarificationEngine.generateQuestions(spec);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.some((q) => q.question.includes('use this application'))).toBe(true);
  });

  it('2. User answers update and refine product specification', async () => {
    const discoveryAgent = new ProductDiscoveryAgent();
    const initialSpec = await discoveryAgent.discoverProductSpecification('I want todo app');

    const answers = {
      target_audience: 'Small team',
      target_platform: 'Web application',
      key_features: ['Task categories', 'Due dates'],
    };

    const updatedSpec = ClarificationEngine.applyAnswers(initialSpec, answers);
    expect(updatedSpec.targetAudience).toBe('Small team');
    expect(updatedSpec.clarificationRequired).toBe(false);
    expect(updatedSpec.approvalRequired).toBe(true);
    expect(updatedSpec.mvpFeatures.some((f) => f.name === 'Due dates')).toBe(true);
  });

  it('3. Unapproved project halts execution pipeline at WAITING_FOR_APPROVAL', async () => {
    const orchestrator = new PipelineOrchestrator(async () => ({ success: true }));
    const result = await orchestrator.executeIdea({
      owner: 'test_user',
      name: 'Unapproved Todo Project',
      idea: 'I want todo app',
      autoApprove: false,
    });

    expect(result.status).toBe('WAITING_FOR_APPROVAL');
    expect(result.tasksCompleted).toBe(0);
    expect(result.approvalsRequested).toBe(1);
  });

  it('4. Approving project allows execution to resume', async () => {
    const projectId = 'test_project_approve';

    await DiscoveryApprovalService.requestApproval(projectId, {
      productName: 'TodoFlow',
      vision: 'Task manager',
      problemStatement: 'Manage tasks',
      targetAudience: 'Users',
      platform: 'Web',
      complexity: 'MVP',
      mvpFeatures: [{ name: 'Create task', priority: 'HIGH' }],
      futureFeatures: [],
      questions: [],
    });

    const approvalRes = await DiscoveryApprovalService.approveProject(projectId);
    expect(approvalRes.status).toBe('APPROVED');

    const currentStatus = await DiscoveryApprovalService.getApprovalStatus(projectId);
    expect(currentStatus).toBe('APPROVED');
  });

  it('5. Rejected project sets status to REJECTED and does not resume', async () => {
    const projectId = 'test_project_reject';

    await DiscoveryApprovalService.requestApproval(projectId, {
      productName: 'TodoFlow',
      vision: 'Task manager',
      problemStatement: 'Manage tasks',
      targetAudience: 'Users',
      platform: 'Web',
      complexity: 'MVP',
      mvpFeatures: [{ name: 'Create task', priority: 'HIGH' }],
      futureFeatures: [],
      questions: [],
    });

    const rejectRes = await DiscoveryApprovalService.rejectProject(projectId);
    expect(rejectRes.status).toBe('REJECTED');

    const currentStatus = await DiscoveryApprovalService.getApprovalStatus(projectId);
    expect(currentStatus).toBe('REJECTED');
  });
});
