export interface CompanyMemoryData {
  vision: string;
  goals: string[];
  userPreferences: Record<string, unknown>;
  constraints: string[];
  risks: string[];
  milestones: string[];
  approvals: string[];
  notes: string[];
}

export type DecisionCategory = 'product' | 'architecture' | 'database' | 'security' | 'technical';
export type DecisionStatus = 'proposed' | 'approved' | 'rejected' | 'superseded';

export interface CompanyDecision {
  id: string;
  projectId: string;
  category: DecisionCategory;
  title: string;
  selectedOption: string;
  alternatives: string[];
  rationale: string;
  confidenceScore: number;
  status: DecisionStatus;
  createdByAgent: string;
  approvedByUser: boolean;
  timestamp: string;
}

export interface KnowledgeNode {
  id: string;
  type: 'feature' | 'decision' | 'architecture' | 'task' | 'agent';
  label: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  relationship: 'depends_on' | 'decided_by' | 'implemented_by' | 'affects' | 'validates';
}

export interface ImpactAnalysisResult {
  changeDescription: string;
  affectedComponents: string[];
  affectedAgents: string[];
  affectedTasks: string[];
  recommendedActions: string[];
}

export interface SearchQueryResult {
  query: string;
  answer: string;
  confidence: number;
  sourceDecisions: CompanyDecision[];
  relevantNotes: string[];
}
