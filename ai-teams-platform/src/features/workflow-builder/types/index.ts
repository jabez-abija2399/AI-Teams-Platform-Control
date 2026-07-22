export type NodeType = 'trigger' | 'action' | 'condition' | 'ai_agent' | 'deploy' | 'webhook' | 'output';

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface WorkflowPipeline {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: 'draft' | 'active' | 'paused' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export interface NodeTemplate {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  defaultConfig: Record<string, unknown>;
}
