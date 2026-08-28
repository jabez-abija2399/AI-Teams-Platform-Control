import { describe, it, expect } from 'vitest';
import { validateWorkspacePath, PathTraversalError } from '../../src/packages/agents/security/path-validator';

describe('Phase 15 Security Validation — Path Traversal', () => {
  it('should block directory traversal outside workspace root (../../etc/passwd)', () => {
    expect(() => validateWorkspacePath('../../etc/passwd')).toThrow(PathTraversalError);
  });

  it('should block absolute system root paths (/root and /etc)', () => {
    expect(() => validateWorkspacePath('/root')).toThrow(PathTraversalError);
    expect(() => validateWorkspacePath('/etc')).toThrow(PathTraversalError);
    expect(() => validateWorkspacePath('/etc/passwd')).toThrow(PathTraversalError);
  });

  it('should block sensitive configuration files (.env and .git)', () => {
    expect(() => validateWorkspacePath('.env')).toThrow(PathTraversalError);
    expect(() => validateWorkspacePath('config/.env.production')).toThrow(PathTraversalError);
    expect(() => validateWorkspacePath('.git')).toThrow(PathTraversalError);
    expect(() => validateWorkspacePath('.git/config')).toThrow(PathTraversalError);
  });

  it('should allow valid workspace paths', () => {
    const valid = validateWorkspacePath('src/components/Header.tsx');
    expect(valid).toContain('workspace');
    expect(valid).toContain('Header.tsx');
  });
});
