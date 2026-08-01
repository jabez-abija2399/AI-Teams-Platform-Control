import type { KnowledgeNode, KnowledgeEdge } from './types';

export class KnowledgeGraphEngine {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: KnowledgeEdge[] = [];

  constructor() {
    // Seed default knowledge graph topology
    this.addNode({ id: 'feat_auth', type: 'feature', label: 'User Authentication System' });
    this.addNode({ id: 'feat_workspace', type: 'feature', label: 'Mission Control Workspace' });
    this.addNode({ id: 'dec_next14', type: 'decision', label: 'Next.js 14 App Router' });
    this.addNode({ id: 'dec_postgres', type: 'decision', label: 'PostgreSQL 16 & Prisma' });
    this.addNode({ id: 'agent_architect', type: 'agent', label: 'Software Architect AI' });
    this.addNode({ id: 'agent_db', type: 'agent', label: 'Database Specialist AI' });

    this.addEdge({ source: 'feat_workspace', target: 'dec_next14', relationship: 'depends_on' });
    this.addEdge({ source: 'dec_next14', target: 'agent_architect', relationship: 'decided_by' });
    this.addEdge({ source: 'dec_postgres', target: 'agent_db', relationship: 'decided_by' });
  }

  public addNode(node: KnowledgeNode) {
    this.nodes.set(node.id, node);
  }

  public addEdge(edge: KnowledgeEdge) {
    this.edges.push(edge);
  }

  public getNodes(): KnowledgeNode[] {
    return Array.from(this.nodes.values());
  }

  public getEdges(): KnowledgeEdge[] {
    return this.edges;
  }

  /**
   * Finds connected nodes for impact propagation
   */
  public getConnectedNodes(nodeId: string): KnowledgeNode[] {
    const connectedIds = new Set<string>();
    for (const edge of this.edges) {
      if (edge.source === nodeId) connectedIds.add(edge.target);
      if (edge.target === nodeId) connectedIds.add(edge.source);
    }

    return Array.from(connectedIds)
      .map((id) => this.nodes.get(id))
      .filter((n): n is KnowledgeNode => n !== undefined);
  }
}
