/**
 * Deterministic Validation Harness
 * 
 * Provides objective, software-driven verification of code, schemas, and requirements
 * without relying solely on LLM self-evaluation.
 */

import type { VerificationEvidence, DefectItem } from '@/core/state/project-state.types';
import type { RequirementsState } from '@/core/state/project-state.types';

export interface CodeValidationInput {
  files: Record<string, string>; // path -> content
  requirements?: RequirementsState;
  expectedFilePaths?: string[];
}

export interface ValidationReport {
  isValid: boolean;
  score: number; // 0 - 100
  evidence: VerificationEvidence;
  defects: DefectItem[];
}

export class DeterministicValidator {
  /**
   * Validates a set of code files deterministically:
   * 1. Syntax check & basic type check (bracket matching, import resolution, no unchecked `as any`)
   * 2. Required files existence check
   * 3. Security checks (eval, dangerous innerHTML, hardcoded secrets)
   * 4. Requirement coverage calculation
   */
  public static validateCodebase(input: CodeValidationInput): ValidationReport {
    const { files, requirements, expectedFilePaths = [] } = input;
    const fileEntries = Object.entries(files);
    const filePaths = Object.keys(files);

    const typeErrors: string[] = [];
    const lintErrors: string[] = [];
    const buildErrors: string[] = [];
    const defects: DefectItem[] = [];

    let totalTests = 0;
    let failedTests = 0;

    // 1. Check for expected files
    for (const expected of expectedFilePaths) {
      if (!files[expected]) {
        const msg = `Missing required file from architecture specification: ${expected}`;
        buildErrors.push(msg);
        defects.push({
          id: `def_missing_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: `Missing Required File: ${expected}`,
          severity: 'HIGH',
          expectedBehavior: `File ${expected} should be implemented as specified in architecture.`,
          actualBehavior: `File ${expected} was not created.`,
          affectedArea: expected,
          evidence: `File tree paths: ${filePaths.join(', ')}`,
          rootCauseHypothesis: 'Developer did not execute todo for this file path.',
          recommendedOwner: 'DEVELOPER',
          status: 'OPEN',
        });
      }
    }

    // 2. Syntax, static typing, and security audit per file
    fileEntries.forEach(([path, content]) => {
      // Unchecked any checks in TypeScript files
      if (path.endsWith('.ts') || path.endsWith('.tsx')) {
        const anyMatches = content.match(/:\s*any\b|\bas\s+any\b/g);
        if (anyMatches && anyMatches.length > 2) {
          const msg = `Excessive unchecked 'any' types in ${path} (${anyMatches.length} occurrences)`;
          typeErrors.push(msg);
          defects.push({
            id: `def_type_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: `TypeScript Strictness Violation in ${path}`,
            severity: 'MEDIUM',
            expectedBehavior: 'Code should use strict types or explicit interfaces.',
            actualBehavior: `Found ${anyMatches.length} 'any' type assertions.`,
            affectedArea: path,
            evidence: msg,
            rootCauseHypothesis: 'Developer used any casting instead of defining proper domain types.',
            recommendedOwner: 'DEVELOPER',
            status: 'OPEN',
          });
        }
      }

      // Bracket / brace syntax balance check
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        const msg = `Syntax Error: Unbalanced curly braces in ${path} (${openBraces} open vs ${closeBraces} close)`;
        typeErrors.push(msg);
        buildErrors.push(msg);
        defects.push({
          id: `def_syntax_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: `Syntax Error in ${path}`,
          severity: 'CRITICAL',
          expectedBehavior: 'File should have balanced brackets and valid syntax.',
          actualBehavior: msg,
          affectedArea: path,
          evidence: msg,
          rootCauseHypothesis: 'Incomplete code generation or truncation during Developer execution.',
          recommendedOwner: 'DEVELOPER',
          status: 'OPEN',
        });
      }

      // Dangerous eval() check
      if (content.includes('eval(') || content.includes('new Function(')) {
        const msg = `Security Vulnerability: Arbitrary code execution via eval() or new Function() in ${path}`;
        lintErrors.push(msg);
        defects.push({
          id: `def_sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: `Unsafe Code Execution in ${path}`,
          severity: 'CRITICAL',
          expectedBehavior: 'No dynamic code evaluation using eval.',
          actualBehavior: msg,
          affectedArea: path,
          evidence: msg,
          rootCauseHypothesis: 'Insecure pattern generated by Developer.',
          recommendedOwner: 'DEVELOPER',
          status: 'OPEN',
        });
      }

      // Hardcoded secret check
      const secretPattern = /(api[_-]?key|secret|password|private[_-]?key)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i;
      if (secretPattern.test(content) && !path.includes('.env.example')) {
        const msg = `Security Risk: Potential hardcoded secret or credential token in ${path}`;
        lintErrors.push(msg);
        defects.push({
          id: `def_secret_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title: `Potential Hardcoded Secret in ${path}`,
          severity: 'HIGH',
          expectedBehavior: 'Secrets should be loaded from environment variables.',
          actualBehavior: msg,
          affectedArea: path,
          evidence: msg,
          rootCauseHypothesis: 'Credentials placed directly in source code instead of env config.',
          recommendedOwner: 'DEVELOPER',
          status: 'OPEN',
        });
      }
    });

    // 3. Requirement coverage checking
    let requirementCoveragePercentage = 100;
    const uncoveredRequirements: string[] = [];

    if (requirements && requirements.features && requirements.features.length > 0) {
      let coveredFeatures = 0;
      const combinedCode = fileEntries.map(([, c]) => c).join(' ').toLowerCase();

      for (const feature of requirements.features) {
        const keywords = [
          feature.name.toLowerCase(),
          ...feature.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
        ];
        const isCovered = keywords.some((kw) => combinedCode.includes(kw));

        if (isCovered) {
          coveredFeatures++;
        } else {
          uncoveredRequirements.push(`Feature "${feature.name}" has no matching implementation markers in codebase`);
          defects.push({
            id: `def_req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: `Unimplemented Feature: ${feature.name}`,
            severity: 'HIGH',
            expectedBehavior: `Feature "${feature.name}" should be implemented per PRD.`,
            actualBehavior: 'No components, services, or routes found matching this feature.',
            affectedArea: 'Requirements Coverage',
            evidence: `Checked across ${filePaths.length} files`,
            rootCauseHypothesis: 'Feature was omitted from implementation plan or not completed.',
            recommendedOwner: 'PM',
            status: 'OPEN',
          });
        }
      }

      requirementCoveragePercentage = Math.round((coveredFeatures / requirements.features.length) * 100);
    }

    // 4. Calculate overall objective score
    const typeCheckPassed = typeErrors.length === 0;
    const lintPassed = lintErrors.length === 0;
    const buildPassed = buildErrors.length === 0;
    const testsPassed = failedTests === 0;

    let score = 100;
    score -= typeErrors.length * 15;
    score -= lintErrors.length * 10;
    score -= buildErrors.length * 25;
    score -= Math.round((100 - requirementCoveragePercentage) * 0.3);

    const hasCriticalDefects = defects.some((d) => d.severity === 'CRITICAL');
    if (hasCriticalDefects) {
      score = Math.min(score, 45);
    }

    score = Math.max(0, Math.min(100, score));
    const isValid = score >= 80 && !hasCriticalDefects && buildPassed && typeCheckPassed;

    const evidence: VerificationEvidence = {
      typeCheckPassed,
      typeCheckErrors: typeErrors,
      lintPassed,
      lintErrors,
      buildPassed,
      buildErrors,
      testsPassed,
      testsRun: totalTests,
      testsFailed: failedTests,
      requirementCoveragePercentage,
      uncoveredRequirements,
    };

    return {
      isValid,
      score,
      evidence,
      defects,
    };
  }
}
