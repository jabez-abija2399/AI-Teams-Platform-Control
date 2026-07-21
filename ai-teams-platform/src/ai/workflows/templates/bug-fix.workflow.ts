import type { WorkflowDefinition } from '@/ai/workflows/core/workflow.types';

export const bugFixWorkflow: WorkflowDefinition = {
  id: 'bug-fix',
  name: 'Bug Fix',
  description: 'Developer AI fixes a reported bug, QA AI verifies.',
  steps: [
    { name: 'Fix Bug', description: 'Analyze and fix the reported bug.', agentRole: 'DEVELOPER' },
    { name: 'Verify Fix', description: 'Verify the fix resolves the bug without regressions.', agentRole: 'QA' },
  ],
};
