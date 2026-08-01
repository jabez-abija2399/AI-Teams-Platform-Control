import { join, resolve, relative, isAbsolute } from 'path';

export class PathTraversalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathTraversalError';
  }
}

const WORKSPACE_ROOT = resolve(join(process.cwd(), 'workspace'));

const FORBIDDEN_PATTERNS = [
  /(^|\/|\\)\.env($|\/|\\|\.)/i,
  /(^|\/|\\)\.git($|\/|\\)/i,
  /(^|\/|\\)node_modules($|\/|\\)/i,
  /(^|\/|\\)package-lock\.json$/i,
  /(^|\/|\\)pnpm-lock\.yaml$/i,
  /(^|\/|\\)yarn\.lock$/i,
  /secrets/i,
  /^\/etc\//i,
  /^\/root/i,
  /^\/var\//i,
  /^\/sys\//i,
  /^\/proc\//i,
  /^\/dev\//i,
];

export function validateWorkspacePath(requestPath: string): string {
  if (!requestPath || typeof requestPath !== 'string') {
    throw new PathTraversalError('Invalid path provided to file validator');
  }

  // Prevent absolute external paths that do not target workspace
  if (isAbsolute(requestPath) && !resolve(requestPath).startsWith(WORKSPACE_ROOT)) {
    throw new PathTraversalError(`Agent attempted access outside workspace: ${requestPath}`);
  }

  const resolvedPath = resolve(join(WORKSPACE_ROOT, requestPath));
  const rel = relative(WORKSPACE_ROOT, resolvedPath);

  // Check parent traversal
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new PathTraversalError(`Agent attempted access outside workspace root: ${requestPath}`);
  }

  // Check forbidden sensitive patterns against the relative path
  const normalizedRel = rel.replace(/\\/g, '/');
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalizedRel) || pattern.test(requestPath)) {
      throw new PathTraversalError(`Agent attempted access to restricted sensitive file or directory: ${requestPath}`);
    }
  }

  return resolvedPath;
}

export function validateTenantWorkspacePath(tenantId: string, requestPath: string): string {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new PathTraversalError('Invalid tenant ID provided for path validation');
  }

  // First validate against global forbidden patterns and basic traversal
  const tenantRoot = resolve(join(WORKSPACE_ROOT, 'tenants', tenantId));

  if (isAbsolute(requestPath) && !resolve(requestPath).startsWith(tenantRoot)) {
    throw new PathTraversalError(`Tenant "${tenantId}" attempted access outside tenant root: ${requestPath}`);
  }

  const resolvedPath = resolve(join(tenantRoot, requestPath));
  const rel = relative(tenantRoot, resolvedPath);

  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new PathTraversalError(`Tenant "${tenantId}" attempted directory traversal outside assigned workspace: ${requestPath}`);
  }

  const normalizedRel = rel.replace(/\\/g, '/');
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalizedRel) || pattern.test(requestPath)) {
      throw new PathTraversalError(`Tenant "${tenantId}" attempted access to restricted sensitive file: ${requestPath}`);
    }
  }

  return resolvedPath;
}

