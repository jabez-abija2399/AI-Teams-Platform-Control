import { describe, it, expect } from 'vitest';
import { validateWorkspacePath, PathTraversalError } from '../../src/packages/agents/security/path-validator';
import { authorizeToolUsage, UnauthorizedToolError } from '../../src/packages/agents/security/tool-permission.guard';

describe('Tool Security & Path Validator', () => {
  describe('PathValidator', () => {
    it('should throw PathTraversalError for directory traversal outside workspace root', () => {
      expect(() => validateWorkspacePath('../../etc/passwd')).toThrow(PathTraversalError);
      expect(() => validateWorkspacePath('../../../root')).toThrow(PathTraversalError);
    });

    it('should throw PathTraversalError for restricted sensitive file patterns', () => {
      expect(() => validateWorkspacePath('.env')).toThrow(PathTraversalError);
      expect(() => validateWorkspacePath('config/.env.local')).toThrow(PathTraversalError);
      expect(() => validateWorkspacePath('.git/config')).toThrow(PathTraversalError);
      expect(() => validateWorkspacePath('node_modules/package/index.js')).toThrow(PathTraversalError);
      expect(() => validateWorkspacePath('package-lock.json')).toThrow(PathTraversalError);
      expect(() => validateWorkspacePath('secrets/api_key.txt')).toThrow(PathTraversalError);
      expect(() => validateWorkspacePath('/etc/shadow')).toThrow(PathTraversalError);
      expect(() => validateWorkspacePath('/root/.ssh/id_rsa')).toThrow(PathTraversalError);
    });

    it('should resolve and return valid relative paths within workspace root', () => {
      const validPath = validateWorkspacePath('src/components/button.tsx');
      expect(validPath).toContain('workspace');
      expect(validPath).toContain('src/components/button.tsx');
    });
  });

  describe('ToolPermissionGuard', () => {
    it('should throw UnauthorizedToolError when CEO attempts to execute write_file or run_command', async () => {
      await expect(authorizeToolUsage('CEO', 'write_file')).rejects.toThrow(UnauthorizedToolError);
      await expect(authorizeToolUsage('CEO', 'run_command')).rejects.toThrow(UnauthorizedToolError);
    });

    it('should allow ARCHITECT to execute read_file', async () => {
      const allowed = await authorizeToolUsage('ARCHITECT', 'read_file');
      expect(allowed).toBe(true);
    });

    it('should allow DEVELOPER to execute write_file and read_file', async () => {
      const canRead = await authorizeToolUsage('DEVELOPER', 'read_file');
      const canWrite = await authorizeToolUsage('DEVELOPER', 'write_file');
      expect(canRead).toBe(true);
      expect(canWrite).toBe(true);
    });
  });
});
