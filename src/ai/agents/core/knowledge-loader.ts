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
  CEO: ['CONSTITUTION', 'MEMORY', 'PRODUCT', 'AI_COMPANY', 'QUALITY_STANDARD'],
  PRODUCT_MANAGER: ['CONSTITUTION', 'PRODUCT', 'AI_COMPANY', 'MEMORY', 'QUALITY_STANDARD'],
  PRODUCT_DISCOVERY: ['CONSTITUTION', 'PRODUCT', 'AI_COMPANY', 'QUALITY_STANDARD'],
  BUSINESS_ANALYST: ['CONSTITUTION', 'PRODUCT', 'ARTIFACTS', 'QUALITY_STANDARD'],
  UI_DESIGNER: ['CONSTITUTION', 'DESIGN_SYSTEM', 'PRODUCT', 'QUALITY_STANDARD'],
  ARCHITECT: ['CONSTITUTION', 'ARCHITECTURE', 'DEV_RULES', 'DECISIONS', 'QUALITY_STANDARD'],
  DEVELOPER: ['CONSTITUTION', 'ARCHITECTURE', 'DEV_RULES', 'AGENT_CONTRACTS', 'ARTIFACTS', 'QUALITY_STANDARD'],
  FRONTEND: ['CONSTITUTION', 'DESIGN_SYSTEM', 'DEV_RULES', 'ARTIFACTS', 'QUALITY_STANDARD'],
  BACKEND: ['CONSTITUTION', 'ARCHITECTURE', 'DEV_RULES', 'DECISIONS', 'QUALITY_STANDARD'],
  DATABASE: ['CONSTITUTION', 'ARCHITECTURE', 'DEV_RULES', 'QUALITY_STANDARD'],
  QA: ['CONSTITUTION', 'DEV_RULES', 'ARTIFACTS', 'QUALITY_STANDARD'],
  SECURITY: ['CONSTITUTION', 'DEV_RULES', 'QUALITY_STANDARD', 'AGENT_CONTRACTS'],
  DEVOPS: ['CONSTITUTION', 'ARCHITECTURE', 'DEV_RULES', 'QUALITY_STANDARD'],
  REVIEWER: ['CONSTITUTION', 'QUALITY_STANDARD', 'DEV_RULES'],
  ARCHITECTURE_REVIEWER: ['CONSTITUTION', 'ARCHITECTURE', 'DECISIONS', 'QUALITY_STANDARD'],
  CODE_REVIEWER: ['CONSTITUTION', 'DEV_RULES', 'QUALITY_STANDARD', 'AGENT_CONTRACTS'],
  QUALITY_REVIEWER: ['CONSTITUTION', 'PRODUCT', 'DESIGN_SYSTEM', 'QUALITY_STANDARD'],
};

const DOMAIN_KNOWLEDGE_SNIPPETS: Record<string, string> = {
  CEO: `## Executive Strategy & Product Vision Guidelines
- Outperform a senior product executive: one-sentence goal restatement, ruthless MVP cuts, explicit stack constraints.
- Prioritize market fit, user value, and long-term health — never invent stacks the user rejected.`,
  PRODUCT_MANAGER: `## Product Management Guidelines
- INVEST stories with testable acceptance criteria; map 1:1 to Discovery MVP.
- Explicit out-of-scope list; forward HTML/CSS / no-backend constraints into every feature spec.`,
  PRODUCT_DISCOVERY: `## Product Discovery Guidelines
- Match requested scope exactly (auth-only stays auth-only). Max 4 MVP features for simple ideas.`,
  BUSINESS_ANALYST: `## Business Analysis Guidelines
- Specs must be unambiguous and testable. Trace Story → Spec → Test. Edge cases are mandatory.`,
  UI_DESIGNER: `## UI Design Guidelines
- Yacht Club tokens (#F2F0EF, #245F73, #733E24). Screens match stack (static → login/signup/home HTML pages).
- Accessibility: labels, focus rings, contrast — no generic purple AI kits.`,
  ARCHITECT: `## Architecture Guidelines
- User constraints beat aesthetics. Explicit Frontend / Backend / Database — use "None" when forbidden.
- No cargo-cult microservices for a static login page.`,
  DEVELOPER: `## Software Development & Implementation Guidelines
- Code matches approved architecture file-for-file. Static stack → real .html/.css, not Next "equivalents".
- Clean, accessible markup; handle edge cases; never ship dead framework configs.`,
  FRONTEND: `## Specialized Frontend Engineering Guidelines
- Match approved architecture first (static HTML/CSS when required; React/Next only when architecture says so).
- Design-system tokens; WCAG 2.1 AA contrast; keyboard focus; no layout thrash.`,
  BACKEND: `## Specialized Backend Engineering Guidelines
- Only when architecture includes a backend. Zod validation, RBAC, standard error JSON, pagination.
- If architecture says backend None — do not invent APIs.`,
  DATABASE: `## Specialized Database & ORM Guidelines
- Only when architecture includes a database. Indexed FKs, clear cardinality, safe migrations.
- If architecture says database None — skip schema entirely.`,
  QA: `## QA Guidelines
- Tests match the real stack (static → HTML checklist; not Jest for no-JS apps).
- Risk-based coverage; call out intentional gaps.`,
  SECURITY: `## Security Guidelines
- Threat model matches reality (static demo ≠ invent bcrypt/session theater).
- Honest risk scores; clear remediation owners.`,
  DEVOPS: `## DevOps Guidelines
- Preview-first; production deploy is always user-triggered.
- Static → nginx / static host; never force Node+Postgres onto static HTML.`,
  ARCHITECTURE_REVIEWER: `## Architecture Review Focus Areas
- Fail stack mismatches and invented backends. Prefer maintainable patterns over clever frameworks.`,
  CODE_REVIEWER: `## Code Review Focus Areas
- Reject stack contradictions and untyped shortcuts without justification. Single responsibility. Async safety.`,
  QUALITY_REVIEWER: `## Quality & UX Review Focus Areas
- Acceptance criteria fidelity. UX friction (empty/error states). No scope creep vs CEO/PM specs.`,
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

