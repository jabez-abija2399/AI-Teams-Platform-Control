import type { ToolDefinition } from './tool.types';

/**
 * Built-in tools available to AI employees, with role-based access control
 */
export const BUILTIN_TOOLS: ToolDefinition[] = [
  {
    name: 'FILE_READ',
    description: 'Read the contents of a source file',
    allowedRoles: [
      'CEO', 'PRODUCT_MANAGER', 'SOFTWARE_ARCHITECT', 'DATABASE_ENGINEER',
      'BACKEND_ENGINEER', 'FRONTEND_ENGINEER', 'UI_ENGINEER', 'QA_ENGINEER',
      'SECURITY_ENGINEER', 'DEVOPS_ENGINEER',
    ],
  },
  {
    name: 'FILE_WRITE',
    description: 'Create or modify a source file',
    allowedRoles: [
      'SOFTWARE_ARCHITECT', 'DATABASE_ENGINEER', 'BACKEND_ENGINEER',
      'FRONTEND_ENGINEER', 'UI_ENGINEER', 'QA_ENGINEER', 'DEVOPS_ENGINEER',
    ],
  },
  {
    name: 'CODE_SEARCH',
    description: 'Search across codebase for patterns or identifiers',
    allowedRoles: [
      'SOFTWARE_ARCHITECT', 'DATABASE_ENGINEER', 'BACKEND_ENGINEER',
      'FRONTEND_ENGINEER', 'QA_ENGINEER', 'SECURITY_ENGINEER',
    ],
  },
  {
    name: 'TERMINAL_EXECUTE',
    description: 'Execute a terminal command (e.g. npm run, npx tsc)',
    allowedRoles: [
      'SOFTWARE_ARCHITECT', 'BACKEND_ENGINEER', 'FRONTEND_ENGINEER',
      'QA_ENGINEER', 'DEVOPS_ENGINEER',
    ],
  },
  {
    name: 'DATABASE_QUERY',
    description: 'Execute a database query or Prisma command',
    allowedRoles: [
      'DATABASE_ENGINEER', 'BACKEND_ENGINEER', 'DEVOPS_ENGINEER',
    ],
  },
  {
    name: 'TEST_RUNNER',
    description: 'Run Vitest test suites and return results',
    allowedRoles: [
      'QA_ENGINEER', 'BACKEND_ENGINEER', 'FRONTEND_ENGINEER', 'DEVOPS_ENGINEER',
    ],
  },
  {
    name: 'GIT_OPERATION',
    description: 'Perform git operations (status, diff, commit)',
    allowedRoles: [
      'DEVOPS_ENGINEER', 'SOFTWARE_ARCHITECT', 'BACKEND_ENGINEER',
    ],
  },
];
