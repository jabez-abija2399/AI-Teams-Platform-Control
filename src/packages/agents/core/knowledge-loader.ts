/**
 * @file knowledge-loader.ts
 * @package @ai-teams/agents/core
 * @description Loads project constitution and organizational memory rules into agent prompts.
 */

import { promises as fs } from 'fs';
import path from 'path';

export class KnowledgeLoader {
  private static cachedConstitution: string | null = null;

  /**
   * Loads the core project constitution.
   */
  public static async loadConstitution(): Promise<string> {
    if (this.cachedConstitution) return this.cachedConstitution;

    const constitutionPath = path.join(process.cwd(), 'doc/project-docs/00_PROJECT_CONSTITUTION.md');
    try {
      const content = await fs.readFile(constitutionPath, 'utf-8');
      this.cachedConstitution = content;
      return content;
    } catch {
      return '# AI Teams Platform Constitution\nStrict quality, non-destructive file edits, zero hallucinations.';
    }
  }

  /**
   * Formats agent prompt context with constitution and design system rules.
   */
  public static async injectContext(systemPrompt: string): Promise<string> {
    const constitution = await this.loadConstitution();
    return `${systemPrompt}\n\n=== ORGANIZATIONAL CONSTITUTION ===\n${constitution}\n===================================`;
  }
}

const ROLE_KNOWLEDGE: Record<string, string> = {
  CEO: 'Executive Strategy: Define product vision, business goals, and measurable milestones. Focus on ROI and market positioning.',
  ARCHITECT: 'System Architecture: Design scalable, maintainable systems. Apply domain-driven design, SOLID principles, and appropriate architectural patterns.',
  DEVELOPER: 'Software Development: Write clean, typed, testable TypeScript code. Follow SOLID principles, avoid side effects, write meaningful tests.',
  FRONTEND: 'Frontend Engineering: Build accessible, performant React UIs. Use proper component composition, memoization, and Tailwind CSS.',
  BACKEND: 'Backend Engineering: Design RESTful APIs with Zod validation, Prisma ORM, and proper error handling. Never expose internal errors to clients.',
  QA: 'Quality Assurance: Design comprehensive test plans covering unit, integration, and e2e tests. Aim for >80% coverage on critical paths.',
  SECURITY: 'Security Engineering: Identify and mitigate OWASP Top 10 vulnerabilities. Enforce authentication, authorization, and input validation.',
  DEVOPS: 'DevOps Engineering: Design CI/CD pipelines, containerization strategies, and infrastructure-as-code for reproducible deployments.',
  PRODUCT_MANAGER: 'Product Management: Translate user needs into structured requirements. Prioritize features by business value and technical feasibility.',
  UI_DESIGNER: 'UI/UX Design: Create accessible, responsive designs with consistent design tokens, component hierarchies, and user-centered flows.',
  DATABASE: 'Database Engineering: Design normalized schemas, optimize queries, and ensure data integrity with proper indexing and constraints.',
  BUSINESS_ANALYST: 'Business Analysis: Map stakeholder requirements to technical specifications. Identify gaps, risks, and non-functional requirements.',
  UX_RESEARCHER: 'UX Research: Conduct user interviews, usability tests, and competitive analysis to inform product decisions.',
  REVIEWER: 'Code Review: Ensure code quality, security, and adherence to project standards. Provide constructive, actionable feedback.',
  DOCUMENTATION: 'Technical Documentation: Write clear, accurate docs covering architecture, APIs, and operational runbooks.',
  OPERATIONS: 'Operations: Monitor system health, respond to incidents, and maintain SLAs through observability and automation.',
};

export function loadKnowledgeForAgent(role: string): string {
  const key = role.toUpperCase().replace(/-/g, '_');
  return ROLE_KNOWLEDGE[key] ?? 'General AI Guidelines: Operate with precision, transparency, and strict adherence to project requirements.';
}
