export type RefactorType =
  | 'EXTRACT_COMPONENT'
  | 'SPLIT_SERVICE'
  | 'REUSE_UTILITY'
  | 'OPTIMIZE_PERFORMANCE'
  | 'CLEANUP_DEAD_CODE';

export interface RefactorCandidate {
  id: string;
  filePath: string;
  type: RefactorType;
  reason: string;
  suggestedAction: string;
  expectedTokenSavings: number;
}

export interface RefactorReport {
  id: string;
  projectId: string;
  candidates: RefactorCandidate[];
  refactorsAppliedCount: number;
  behaviorPreserved: boolean;
  typeScriptClean: boolean;
  createdAt: string;
}
