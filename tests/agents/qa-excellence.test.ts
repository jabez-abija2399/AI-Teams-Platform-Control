import { describe, it, expect, beforeEach } from 'vitest';
import { generateQaReportSpec, buildHeuristicQaReport } from '@/ai/agents/roles/qa/qa.service';
import { ProjectStateManager } from '@/core/state/project-state.manager';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';
import { AgentContractRegistry } from '@/core/contracts/agent-registry';

describe('QA Agent Excellence', () => {
  const projectId = 'qa-test-project-1';

  const sampleImplementation = {
    title: 'Enterprise Task Manager',
    files: [
      { path: 'src/App.tsx', content: 'export default function App() { return <div>Tasks</div>; }' },
      { path: 'src/components/TaskList.tsx', content: 'export function TaskList() { return <ul><li>Task 1</li></ul>; }' },
    ],
  };

  beforeEach(async () => {
    await ProjectStateManager.getState(projectId);
  });

  it('1. Enforces strict QA contract boundaries and tool permissions', () => {
    const contract = AgentContractRegistry.getContract('QA');
    expect(contract.role).toBe('QA');
    expect(contract.questionAnswered).toBe('DID we build the correct thing correctly?');
    expect(contract.forbiddenActions).toContain('Rely solely on subjective LLM opinion when objective tools are available');
    expect(contract.forbiddenActions).toContain('Directly modify production source code');
    expect(contract.outputArtifactType).toBe('QA_VERIFICATION_REPORT');
  });

  it('2. Generates comprehensive test plan, coverage analysis, and quality verdict', async () => {
    const result = await generateQaReportSpec(projectId, sampleImplementation);
    expect(result.success).toBe(true);
    if (!result.success) return;

    const report = result.data;
    expect(report.e2eTests.length).toBeGreaterThan(0);
    expect(report.qualityReport.score).toBeGreaterThan(0);
    expect(report.qualityReport.verdict).toBeDefined();
    expect(report.coverageAnalysis.estimatedCoverage).toBeGreaterThan(0);

    for (const test of report.e2eTests) {
      expect(test.id).toBeDefined();
      expect(test.title).toBeDefined();
      expect(test.expectedResult).toBeDefined();
    }
  });

  it('3. Atomically updates ProjectStateManager with QA Evidence and Recommendation', async () => {
    await generateQaReportSpec(projectId, sampleImplementation);

    const state = await ProjectStateManager.getState(projectId);
    expect(state.currentStage).toBe('TESTING');
    expect(state.qa.passed).toBe(true);
    expect(state.qa.overallScore).toBeGreaterThanOrEqual(80);
    expect(state.qa.evidence.testsPassed).toBe(true);
    expect(state.qa.recommendation).toBe('SHIP_TO_PRODUCTION');
  });

  it('4. Registers versioned envelopes in ArtifactRegistryService with quality scores', async () => {
    await generateQaReportSpec(projectId, sampleImplementation);

    const latestArtifact = await ArtifactRegistryService.getLatestArtifact(projectId, 'QA_VERIFICATION_REPORT');
    expect(latestArtifact).toBeDefined();
    expect(latestArtifact?.metadata.createdBy).toBe('QA');
    expect(latestArtifact?.metadata.contentHash).toBeDefined();
    expect(latestArtifact?.metadata.qualityScore.completeness).toBeGreaterThanOrEqual(80);
    expect(latestArtifact?.metadata.qualityScore.verdict).toBe('APPROVED');
  });
});
