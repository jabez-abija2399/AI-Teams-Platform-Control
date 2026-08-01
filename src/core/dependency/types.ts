export interface CodeIssue {
  id: string;
  type: 'CIRCULAR_DEPENDENCY' | 'UNUSED_COMPONENT' | 'DUPLICATE_COMPONENT' | 'DEAD_CODE' | 'LARGE_COMPONENT' | 'DUPLICATE_HOOK' | 'BROKEN_IMPORT';
  filePath: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RefactoringSuggestion {
  id: string;
  issueId: string;
  recommendation: string;
  estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DependencyGraphReport {
  nodesCount: number;
  edgesCount: number;
  detectedIssues: CodeIssue[];
  refactoringSuggestions: RefactoringSuggestion[];
  graphs: {
    componentGraph: { nodes: string[]; edges: { from: string; to: string }[] };
    serviceGraph: { nodes: string[]; edges: { from: string; to: string }[] };
    apiGraph: { nodes: string[]; edges: { from: string; to: string }[] };
    databaseGraph: { nodes: string[]; edges: { from: string; to: string }[] };
  };
  healthScore: number;
}
