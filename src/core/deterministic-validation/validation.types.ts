/**
 * Deterministic Validation Types
 * 
 * Records objective evidence from sandbox execution (exit code, stdout, stderr, duration).
 * QA evaluates quality strictly from these results.
 */

export interface ValidationStepResult {
  step: 'typecheck' | 'lint' | 'test' | 'build' | 'syntax' | 'security';
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  passed: boolean;
  errorSnippet?: string;
}

export interface ValidationEvidence {
  projectId: string;
  timestamp: string;
  allPassed: boolean;
  steps: ValidationStepResult[];
  summary: {
    totalSteps: number;
    passedSteps: number;
    failedSteps: number;
    totalDurationMs: number;
  };
  metrics: {
    typecheckPassed: boolean;
    lintPassed: boolean;
    testsPassed: boolean;
    buildPassed: boolean;
    testCount?: number;
    passedCount?: number;
    failedCount?: number;
  };
  rawFilesCount: number;
}
