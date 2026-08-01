import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../../src/core/tools/tool-registry';
import { ToolExecutor } from '../../src/core/tools/tool-executor';

describe('Phase 29 — Tool Execution Framework', () => {
  it('1. Registers built-in tools and retrieves by name', () => {
    const tool = ToolRegistry.getTool('FILE_WRITE');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('FILE_WRITE');
    expect(tool?.allowedRoles.length).toBeGreaterThan(0);
  });

  it('2. Returns tools available to a specific role', () => {
    const beTools = ToolRegistry.getToolsForRole('BACKEND_ENGINEER');
    const toolNames = beTools.map((t) => t.name);
    expect(toolNames).toContain('FILE_READ');
    expect(toolNames).toContain('FILE_WRITE');
    expect(toolNames).toContain('TERMINAL_EXECUTE');
  });

  it('3. Executes authorized tool successfully', async () => {
    const result = await ToolExecutor.execute(
      { toolName: 'TEST_RUNNER', params: { suite: 'all' } },
      'QA_ENGINEER'
    );
    expect(result.status).toBe('success');
    expect(result.result).toBeDefined();
  });

  it('4. Blocks unauthorized tool execution', async () => {
    const result = await ToolExecutor.execute(
      { toolName: 'DATABASE_QUERY', params: { query: 'DROP TABLE users' } },
      'FRONTEND_ENGINEER'
    );
    expect(result.status).toBe('denied');
    expect(result.error).toContain('FRONTEND_ENGINEER');
    expect(result.error).toContain('DATABASE_QUERY');
  });

  it('5. Frontend Engineer cannot execute database migrations', async () => {
    expect(ToolRegistry.isToolAllowed('DATABASE_QUERY', 'FRONTEND_ENGINEER')).toBe(false);
    expect(ToolRegistry.isToolAllowed('DATABASE_QUERY', 'UI_ENGINEER')).toBe(false);
  });

  it('6. Database Engineer cannot modify frontend components via GIT_OPERATION', () => {
    expect(ToolRegistry.isToolAllowed('GIT_OPERATION', 'DATABASE_ENGINEER')).toBe(false);
  });
});
