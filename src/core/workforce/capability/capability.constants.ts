import type { AgentCapabilityDefinition } from './capability.types';

export const ROLE_CAPABILITIES: AgentCapabilityDefinition[] = [
  {
    role: 'CEO',
    domain: 'Executive Leadership',
    keywords: ['strategy', 'roadmap', 'proposal', 'governance', 'vision', 'milestone', 'ceo', 'planning'],
    skills: ['Strategic Planning', 'Resource Allocation', 'Project Alignment'],
    baseConfidence: 0.95,
  },
  {
    role: 'PRODUCT_MANAGER',
    domain: 'Product Management',
    keywords: ['spec', 'srs', 'requirements', 'clarification', 'features', 'user story', 'backlog'],
    skills: ['Product Discovery', 'Feature Prioritization', 'Specification Writing'],
    baseConfidence: 0.92,
  },
  {
    role: 'SOFTWARE_ARCHITECT',
    domain: 'Software Architecture',
    keywords: ['architecture', 'design', 'system', 'stack', 'quality', 'topology', 'modular', 'score'],
    skills: ['System Design', 'Module Separation', 'Tech Stack Evaluation'],
    baseConfidence: 0.94,
  },
  {
    role: 'DATABASE_ENGINEER',
    domain: 'Database Engineering',
    keywords: ['database', 'db', 'schema', 'prisma', 'postgres', 'sql', 'migration', 'table', 'index', 'model'],
    skills: ['PostgreSQL', 'Prisma Schema Design', 'Query Optimization'],
    baseConfidence: 0.96,
  },
  {
    role: 'BACKEND_ENGINEER',
    domain: 'Backend Development',
    keywords: ['backend', 'api', 'server', 'node', 'route', 'controller', 'jwt', 'auth', 'endpoint', 'rest'],
    skills: ['Node.js API Routes', 'Authentication Logic', 'Middleware Architecture'],
    baseConfidence: 0.93,
  },
  {
    role: 'FRONTEND_ENGINEER',
    domain: 'Frontend Development',
    keywords: ['frontend', 'ui', 'react', 'next.js', 'component', 'view', 'client', 'page', 'dashboard'],
    skills: ['React 18', 'Next.js App Router', 'Client Components'],
    baseConfidence: 0.91,
  },
  {
    role: 'UI_ENGINEER',
    domain: 'UI/UX Design',
    keywords: ['style', 'css', 'design', 'glassmorphism', 'theme', 'color', 'typography', 'layout', 'animation'],
    skills: ['Vanilla CSS Styling', 'Glassmorphism UX', 'Responsive Layouts'],
    baseConfidence: 0.90,
  },
  {
    role: 'QA_ENGINEER',
    domain: 'Quality Assurance',
    keywords: ['test', 'vitest', 'unit test', 'qa', 'e2e', 'validation', 'automation', 'coverage', 'bug'],
    skills: ['Vitest Execution', 'Automated E2E Tests', 'Regression Validation'],
    baseConfidence: 0.95,
  },
  {
    role: 'SECURITY_ENGINEER',
    domain: 'Cybersecurity',
    keywords: ['security', 'vulnerability', 'audit', 'owasp', 'token', 'permission', 'rbac', 'encryption'],
    skills: ['Vulnerability Assessment', 'Auth Security Inspection', 'RBAC Audit'],
    baseConfidence: 0.96,
  },
  {
    role: 'DEVOPS_ENGINEER',
    domain: 'DevOps & Infrastructure',
    keywords: ['devops', 'ci/cd', 'docker', 'deploy', 'pipeline', 'worker', 'infrastructure', 'build'],
    skills: ['CI/CD Pipelines', 'Containerization', 'Deployment Orchestration'],
    baseConfidence: 0.94,
  },
];
