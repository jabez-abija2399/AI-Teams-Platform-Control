import { describe, it, expect } from 'vitest';
import { SpecificationEngine } from '../../src/core/specification/specification-engine';
import { AutonomousProjectPlanner } from '../../src/core/planner/planner';

describe('Phase 22 — Autonomous Project Planner', () => {
  it('should generate execution plan and DAG from SRS specification', async () => {
    const spec = await SpecificationEngine.generateSpecification('proj-plan-1', 'AI Task Automation System');
    const plan = await AutonomousProjectPlanner.generateExecutionPlan(spec);

    expect(plan.projectId).toBe('proj-plan-1');
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.dagEdges.length).toBeGreaterThan(0);
    expect(plan.milestones.length).toBe(3);
    expect(plan.requiredAgents.length).toBe(9);
    expect(plan.criticalPath.length).toBeGreaterThan(0);
  });
});
