import { describe, it, expect } from 'vitest';
import { authorizeToolUsage, UnauthorizedToolError } from '../../src/packages/agents/security/tool-permission.guard';

describe('Phase 15 Security Validation — Tool Permissions', () => {
  it('should block CEO from executing write_file(), run_command(), and deploy()', async () => {
    await expect(authorizeToolUsage('CEO', 'write_file')).rejects.toThrow(UnauthorizedToolError);
    await expect(authorizeToolUsage('CEO', 'run_command')).rejects.toThrow(UnauthorizedToolError);
    await expect(authorizeToolUsage('CEO', 'deploy')).rejects.toThrow(UnauthorizedToolError);
  });

  it('should block QA from attempting modify_database_schema', async () => {
    await expect(authorizeToolUsage('QA', 'modify_database_schema')).rejects.toThrow(UnauthorizedToolError);
  });

  it('should block Developer from attempting approve_production', async () => {
    await expect(authorizeToolUsage('DEVELOPER', 'approve_production')).rejects.toThrow(UnauthorizedToolError);
  });

  it('should allow Developer to execute valid development tools (read_file, write_file, run_command)', async () => {
    await expect(authorizeToolUsage('DEVELOPER', 'read_file')).resolves.toBe(true);
    await expect(authorizeToolUsage('DEVELOPER', 'write_file')).resolves.toBe(true);
    await expect(authorizeToolUsage('DEVELOPER', 'run_command')).resolves.toBe(true);
  });
});
