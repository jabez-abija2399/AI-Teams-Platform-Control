/**
 * Root Cause Diagnoser
 * 
 * Classifies QA / validation failures into root-cause buckets and determines the proper remediation route.
 */

import type { RootCauseCategory, RootCauseDiagnosis } from './root-cause.types';
import type { ValidationEvidence } from '../deterministic-validation/validation.types';

export class RootCauseDiagnoser {
  public static diagnose(params: {
    failureReason: string;
    validationEvidence?: ValidationEvidence | null;
    qaNotes?: string;
    defectList?: string[];
  }): RootCauseDiagnosis {
    const { failureReason, validationEvidence, qaNotes = '', defectList = [] } = params;
    const text = `${failureReason} ${qaNotes} ${defectList.join(' ')}`.toLowerCase();

    // 1. Missing Requirement or User Story ambiguity
    if (
      /\b(unclear requirement|missing user story|scope mismatch|ambiguous spec|pm clarification|product requirement missing|acceptance criteria unfulfilled)\b/.test(
        text,
      )
    ) {
      return {
        category: 'REQUIREMENT',
        confidence: 0.9,
        explanation: 'Requirement ambiguity or unfulfilled product scope detected.',
        responsibleRole: 'PM',
        recommendedRemediation: 'PM Agent must clarify product requirements and update user stories.',
        affectedFiles: [],
        remediationPhase: 'PRODUCT_RUNNING',
        invalidationTargetPhases: ['ARCHITECTURE_RUNNING', 'DEVELOPMENT_RUNNING', 'TESTING_RUNNING'],
      };
    }

    // 2. Architecture / Stack / Database Schema design flaws
    if (
      /\b(schema conflict|database migration error|incompatible stack|module boundary violation|api contract mismatch|architectural constraint)\b/.test(
        text,
      )
    ) {
      return {
        category: 'ARCHITECTURE',
        confidence: 0.88,
        explanation: 'Architecture or system schema design conflict detected.',
        responsibleRole: 'ARCHITECT',
        recommendedRemediation: 'Architect Agent must adjust system design, API contracts, or DB schemas.',
        affectedFiles: [],
        remediationPhase: 'ARCHITECTURE_RUNNING',
        invalidationTargetPhases: ['DEVELOPMENT_RUNNING', 'TESTING_RUNNING'],
      };
    }

    // 3. UI / Design / Token / Accessibility issues
    if (
      /\b(color contrast|broken layout|missing responsive style|unusable mobile view|component token mismatch|ux defect)\b/.test(
        text,
      )
    ) {
      return {
        category: 'DESIGN',
        confidence: 0.85,
        explanation: 'UI design token or layout specification defect detected.',
        responsibleRole: 'DESIGNER',
        recommendedRemediation: 'Designer Agent must refine UI component specs and design tokens.',
        affectedFiles: [],
        remediationPhase: 'DESIGN_RUNNING',
        invalidationTargetPhases: ['DEVELOPMENT_RUNNING', 'TESTING_RUNNING'],
      };
    }

    // 4. Infrastructure / Environment / Port conflicts
    if (
      /\b(port in use|eaddrinuse|out of memory|sandbox crash|node version mismatch|missing env var|docker error)\b/.test(
        text,
      )
    ) {
      return {
        category: 'ENVIRONMENT',
        confidence: 0.92,
        explanation: 'Sandbox runtime or environment configuration issue.',
        responsibleRole: 'DEVOPS',
        recommendedRemediation: 'DevOps / Sandbox manager must verify environment and dependencies.',
        affectedFiles: [],
        remediationPhase: 'DEPLOYMENT_RUNNING',
        invalidationTargetPhases: [],
      };
    }

    // 5. Code Implementation / TypeScript / Syntax / Lint / Test failure
    const affectedFiles: string[] = [];
    if (validationEvidence) {
      validationEvidence.steps.forEach((s) => {
        if (!s.passed && s.stderr) {
          const fileMatches = s.stderr.match(/([a-zA-Z0-9_\-./]+\.(?:tsx?|jsx?|json|css|py))/g);
          if (fileMatches) affectedFiles.push(...fileMatches);
        }
      });
    }

    return {
      category: 'IMPLEMENTATION',
      confidence: 0.95,
      explanation: 'Code implementation error (typecheck, lint, or test failure).',
      responsibleRole: 'DEVELOPER',
      recommendedRemediation: 'Developer Agent must fix code errors in affected files.',
      affectedFiles: Array.from(new Set(affectedFiles)),
      remediationPhase: 'DEVELOPMENT_RUNNING',
      invalidationTargetPhases: ['TESTING_RUNNING'],
    };
  }
}
