import { ControlledFeedbackEngine } from '@/core/feedback/controlled-feedback.engine';

describe('ControlledFeedbackEngine', () => {
  const testProjectId = 'test-proj-feedback-123';

  it('should submit upward feedback escalation from Developer to Architect', async () => {
    const result = await ControlledFeedbackEngine.escalateFeedback({
      projectId: testProjectId,
      fromAgentRole: 'DEVELOPER',
      toAgentRole: 'ARCHITECT',
      issueType: 'TECHNICAL_BLOCKER',
      description: 'Need connection pool configuration for database scaling',
      targetArtifactType: 'ARCHITECTURE',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fromAgentRole).toBe('DEVELOPER');
      expect(result.data.toAgentRole).toBe('ARCHITECT');
      expect(result.data.targetVersion).toBeGreaterThan(0);
      expect(result.data.resolutionStatus).toBe('OPEN');
    }
  });

  it('should list project escalations', async () => {
    const result = await ControlledFeedbackEngine.getEscalations(testProjectId);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBeGreaterThan(0);
    }
  });
});
