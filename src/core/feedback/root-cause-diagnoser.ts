/**
 * Root Cause Diagnosis Engine
 * 
 * Analyzes QA verification failures and deterministically routes the defect
 * to the appropriate upstream owner (PM, Architect, Designer, or Developer)
 * with actionable remediation context.
 */

import type { DefectItem, DefectRootCauseOwner } from '@/core/state/project-state.types';

export interface DiagnosisResult {
  primaryOwner: DefectRootCauseOwner;
  confidence: number; // 0 - 1
  rationale: string;
  remediationPrompt: string;
  affectedPhase: 'REQUIREMENTS' | 'ARCHITECTURE' | 'DESIGN' | 'IMPLEMENTATION';
  upstreamDefects: DefectItem[];
}

export class RootCauseDiagnoser {
  /**
   * Diagnoses a collection of defects and determines the primary root cause owner.
   */
  public static diagnose(defects: DefectItem[]): DiagnosisResult {
    if (defects.length === 0) {
      return {
        primaryOwner: 'DEVELOPER',
        confidence: 1.0,
        rationale: 'No defects detected.',
        remediationPrompt: 'Verification passed with zero defects.',
        affectedPhase: 'IMPLEMENTATION',
        upstreamDefects: [],
      };
    }

    // Count defects attributed to each role
    const scores: Record<DefectRootCauseOwner, number> = {
      PM: 0,
      ARCHITECT: 0,
      DESIGNER: 0,
      DEVELOPER: 0,
    };

    const ownerWeights: Record<string, DefectRootCauseOwner> = {
      'requirement': 'PM',
      'scope': 'PM',
      'user story': 'PM',
      'acceptance criteria': 'PM',
      'unimplemented feature': 'PM',
      'architecture': 'ARCHITECT',
      'database': 'ARCHITECT',
      'schema': 'ARCHITECT',
      'stack mismatch': 'ARCHITECT',
      'api contract': 'ARCHITECT',
      'design': 'DESIGNER',
      'ui': 'DESIGNER',
      'responsive': 'DESIGNER',
      'css': 'DESIGNER',
      'token': 'DESIGNER',
      'type error': 'DEVELOPER',
      'syntax': 'DEVELOPER',
      'runtime': 'DEVELOPER',
      'security': 'DEVELOPER',
      'eval': 'DEVELOPER',
      'missing file': 'DEVELOPER',
    };

    for (const defect of defects) {
      const weight = defect.severity === 'CRITICAL' ? 3 : defect.severity === 'HIGH' ? 2 : 1;
      let matchedOwner: DefectRootCauseOwner = defect.recommendedOwner || 'DEVELOPER';

      const text = `${defect.title} ${defect.rootCauseHypothesis} ${defect.affectedArea}`.toLowerCase();
      for (const [keyword, owner] of Object.entries(ownerWeights)) {
        if (text.includes(keyword)) {
          matchedOwner = owner;
          break;
        }
      }

      scores[matchedOwner] += weight;
    }

    // Determine highest score owner (PM takes precedence if requirements are broken)
    let primaryOwner: DefectRootCauseOwner = 'DEVELOPER';
    if (scores.PM > 0 && scores.PM >= scores.ARCHITECT && scores.PM >= scores.DEVELOPER) {
      primaryOwner = 'PM';
    } else if (scores.ARCHITECT > 0 && scores.ARCHITECT >= scores.DEVELOPER) {
      primaryOwner = 'ARCHITECT';
    } else if (scores.DESIGNER > 0 && scores.DESIGNER >= scores.DEVELOPER) {
      primaryOwner = 'DESIGNER';
    } else {
      primaryOwner = 'DEVELOPER';
    }

    const totalWeight = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalWeight > 0 ? Math.min(1.0, (scores[primaryOwner] / totalWeight) + 0.2) : 0.9;

    const phaseMap: Record<DefectRootCauseOwner, DiagnosisResult['affectedPhase']> = {
      PM: 'REQUIREMENTS',
      ARCHITECT: 'ARCHITECTURE',
      DESIGNER: 'DESIGN',
      DEVELOPER: 'IMPLEMENTATION',
    };

    const relevantDefects = defects.filter((d) => d.recommendedOwner === primaryOwner || primaryOwner === 'DEVELOPER');
    const defectSummaries = relevantDefects.map((d) => `- [${d.severity}] ${d.title}: ${d.evidence} (Root cause: ${d.rootCauseHypothesis})`).join('\n');

    let remediationPrompt = '';
    switch (primaryOwner) {
      case 'PM':
        remediationPrompt = `QA audit detected missing or ambiguous requirements:\n${defectSummaries}\n\nPlease revise the PRD to clarify scope and add missing acceptance criteria before re-architecture.`;
        break;
      case 'ARCHITECT':
        remediationPrompt = `QA audit detected architectural / system design defects:\n${defectSummaries}\n\nPlease update the architecture specification, database schema, or file plan to resolve these design flaws.`;
        break;
      case 'DESIGNER':
        remediationPrompt = `QA audit detected UI / UX design specification defects:\n${defectSummaries}\n\nPlease update the design tokens, component interaction states, or responsive rules.`;
        break;
      case 'DEVELOPER':
        remediationPrompt = `QA audit detected implementation defects / compiler errors:\n${defectSummaries}\n\nPlease inspect the affected files, apply the required code fixes, and verify compiler output.`;
        break;
    }

    return {
      primaryOwner,
      confidence: Math.round(confidence * 100) / 100,
      rationale: `Detected ${defects.length} defect(s). Highest impact concentrated in ${primaryOwner} domain (${scores[primaryOwner]} weighted score).`,
      remediationPrompt,
      affectedPhase: phaseMap[primaryOwner],
      upstreamDefects: relevantDefects,
    };
  }
}
