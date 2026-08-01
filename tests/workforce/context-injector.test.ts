import { describe, it, expect } from 'vitest';
import { ContextInjectorService } from '../../src/core/workforce/context/context-injector.service';
import { ContextValidatorService } from '../../src/core/workforce/context/context-validator.service';

describe('Phase 28 Step 3 — Context Injector Service', () => {
  const projectId = 'proj_context_test';

  it('1. Loads agent profile, capability, and memory to build complete execution context', async () => {
    const context = await ContextInjectorService.injectContextForTask(
      'task_api_auth',
      'Design PostgreSQL Database Schema and REST API Handler',
      'Implement tables and authentication controllers',
      projectId
    );

    expect(context.agentId).toBeDefined();
    expect(context.role).toBe('DATABASE_ENGINEER');
    expect(context.personality).toBeDefined();
    expect(context.experienceLevel).toBeDefined();
    expect(context.capabilities.length).toBeGreaterThan(0);
    expect(context.task.id).toBe('task_api_auth');
    expect(context.task.title).toBe('Design PostgreSQL Database Schema and REST API Handler');
    expect(context.project.vision).toBeDefined();
    expect(context.project.architectureDecisions.length).toBeGreaterThan(0);
    expect(context.reviewerRequirements.securityChecks).toBe(true);
  });

  it('2. Context Validator validates valid context with zero errors', async () => {
    const context = await ContextInjectorService.injectContextForTask(
      'task_val_test',
      'Build React Component with Vitest testing',
      'Frontend client view',
      projectId
    );

    const validation = ContextValidatorService.validate(context);
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });
});
