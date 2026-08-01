import { readFileSync } from 'fs';
import { join } from 'path';

const DOCS_DIR = join(process.cwd(), 'doc', 'project-docs');

const DOC_FILES = {
  CONSTITUTION: '00_PROJECT_CONSTITUTION.md',
  MEMORY: '01_PROJECT_MEMORY.md',
  PRODUCT: '02_PRODUCT.md',
  ARCHITECTURE: '03_ARCHITECTURE.md',
  AI_COMPANY: '04_AI_COMPANY.md',
  WORKFLOWS: '05_WORKFLOWS.md',
  ARTIFACTS: '06_ARTIFACT_SYSTEM.md',
  AGENT_CONTRACTS: '07_AGENT_CONTRACTS.md',
  DESIGN_SYSTEM: '08_DESIGN_SYSTEM.md',
  DEV_RULES: '09_DEVELOPMENT_RULES.md',
  ROADMAP: '10_ROADMAP.md',
  DECISIONS: '11_DECISION_LOG.md',
  CURRENT_TASK: '12_CURRENT_TASK.md',
  TASK: '12_CURRENT_TASK.md',
  QUALITY_STANDARD: '14_AGENT_QUALITY_STANDARD.md',
} as const;

type DocKey = keyof typeof DOC_FILES;

function loadDoc(key: DocKey): string {
  try {
    const content = readFileSync(join(DOCS_DIR, DOC_FILES[key]), 'utf-8');
    return content.slice(0, 4000);
  } catch {
    return '';
  }
}

const KNOWLEDGE_MAP: Record<string, DocKey[]> = {
  CEO: ['CONSTITUTION', 'MEMORY', 'PRODUCT', 'AI_COMPANY'],
  ARCHITECT: ['CONSTITUTION', 'ARCHITECTURE', 'DEV_RULES', 'DECISIONS'],
  PRODUCT_MANAGER: ['CONSTITUTION', 'PRODUCT', 'AI_COMPANY', 'MEMORY'],
  DEVELOPER: ['CONSTITUTION', 'ARCHITECTURE', 'DEV_RULES', 'AGENT_CONTRACTS', 'ARTIFACTS'],
  FRONTEND: ['CONSTITUTION', 'DESIGN_SYSTEM', 'DEV_RULES', 'ARTIFACTS'],
  BACKEND: ['CONSTITUTION', 'ARCHITECTURE', 'DEV_RULES', 'DECISIONS'],
  DATABASE: ['CONSTITUTION', 'ARCHITECTURE', 'DEV_RULES'],
  QA: ['CONSTITUTION', 'DEV_RULES', 'ARTIFACTS', 'QUALITY_STANDARD'],
  REVIEWER: ['CONSTITUTION', 'QUALITY_STANDARD', 'DEV_RULES'],
  ARCHITECTURE_REVIEWER: ['CONSTITUTION', 'ARCHITECTURE', 'DECISIONS', 'QUALITY_STANDARD'],
  CODE_REVIEWER: ['CONSTITUTION', 'DEV_RULES', 'QUALITY_STANDARD', 'AGENT_CONTRACTS'],
  QUALITY_REVIEWER: ['CONSTITUTION', 'PRODUCT', 'DESIGN_SYSTEM', 'QUALITY_STANDARD'],
};

const DOMAIN_KNOWLEDGE_SNIPPETS: Record<string, string> = {
  CEO: `## Executive Strategy & Product Vision Guidelines
- Maintain alignment with core project constitution and strategic goals.
- Prioritize market fit, user value, and long-term architectural health.`,
  DEVELOPER: `## Software Development & Implementation Guidelines
- Write clean, modular, strict TypeScript code adhering to SOLID principles.
- Handle all error states and edge cases systematically.`,
  FRONTEND: `## Specialized Frontend Engineering Guidelines
- Always use React 19 / Next.js best practices (Server Components by default, Client Components only when state/interactivity required).
- Enforce Vanilla CSS or Tailwind CSS tokens from the design system; avoid arbitrary magic values.
- Accessibility: Ensure proper aria labels, keyboard focus trapping for modals, and WCAG 2.1 AA color contrast.
- Performance: Prevent layout shifts (CLS), optimize images, and avoid unnecessary re-renders.`,
  BACKEND: `## Specialized Backend Engineering Guidelines
- API Security: Validate all incoming request headers, queries, and bodies using Zod schemas.
- Error Handling: Return standard error JSON structures with appropriate HTTP status codes (400, 401, 403, 404, 500).
- Authentication: Verify session tokens and enforce role-based access control (RBAC) before executing business logic.
- Performance: Implement pagination on list endpoints and avoid N+1 database queries.`,
  DATABASE: `## Specialized Database & ORM Guidelines
- Schema Modeling: Define relational fields with explicit cardinality and CASCADE/SET NULL delete behaviors.
- Indexing: Ensure all foreign key columns and frequently queried fields (e.g., email, slug, status) have indexes.
- Migrations: Never drop columns or tables containing production data without multi-phase migration safety steps.`,
  ARCHITECTURE_REVIEWER: `## Architecture Review Focus Areas
- Scalability: Verify if the system can scale to 10x load without a rewrite.
- Security Boundary: Check for proper separation between client and server; ensure secrets are never exposed.
- Maintainability: Prefer standard, well-tested architectural patterns over clever or complex custom frameworks.`,
  CODE_REVIEWER: `## Code Review Focus Areas
- Strict TypeScript: Reject any use of 'any', unchecked type casts, or non-null assertions ('!') without explicit justification.
- SOLID Principles: Check that functions and components have a single responsibility.
- Async Safety: Ensure all promises are handled and errors are caught in async/await blocks.`,
  QUALITY_REVIEWER: `## Quality & UX Review Focus Areas
- Acceptance Criteria: Verify that every single user story acceptance criterion is met.
- UX Friction: Check for missing empty states, unclear error messages, or confusing user flows.
- PRD Fidelity: Ensure the deliverables match the original CEO and PM specifications without scope creep or omission.`,
};

export function loadKnowledgeForAgent(role: string): string {
  const docKeys = KNOWLEDGE_MAP[role] ?? ['CONSTITUTION'];
  const parts = docKeys.map((key) => {
    const content = loadDoc(key);
    return content ? `## ${DOC_FILES[key]}\n${content}` : '';
  }).filter(Boolean);

  const domainSnippet = DOMAIN_KNOWLEDGE_SNIPPETS[role] ?? `## General AI Guidelines\n- Adhere to platform quality standards and role boundaries.`;
  parts.push(domainSnippet);

  return parts.length
    ? `\n# Project Knowledge\n${parts.join('\n\n')}`
    : '';
}

