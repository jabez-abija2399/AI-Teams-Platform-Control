export interface DocPage {
  id: string;
  projectId: string;
  type: string;
  title: string;
  content: string;
  version: number;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocVersion {
  id: string;
  documentId: string;
  content: string;
  version: number;
  createdAt: Date;
}

export interface KnowledgeEntry {
  id: string;
  projectId: string;
  source: string;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AgentDecisionEntry {
  id: string;
  agentId: string;
  decision: string;
  reasoning: string;
  outcome: string;
  confidence: number;
  createdAt: Date;
}

export interface DocTreeNode {
  id: string;
  title: string;
  type: string;
  children: DocTreeNode[];
}
