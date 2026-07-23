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
  QA: ['CONSTITUTION', 'DEV_RULES', 'ARTIFACTS'],
  REVIEWER: ['CONSTITUTION', 'QUALITY_STANDARD', 'DEV_RULES'],
};

export function loadKnowledgeForAgent(role: string): string {
  const docKeys = KNOWLEDGE_MAP[role] ?? ['CONSTITUTION'];
  const parts = docKeys.map((key) => {
    const content = loadDoc(key);
    return content ? `## ${DOC_FILES[key]}\n${content}` : '';
  }).filter(Boolean);

  return parts.length
    ? `\n# Project Knowledge\n${parts.join('\n\n')}`
    : '';
}
