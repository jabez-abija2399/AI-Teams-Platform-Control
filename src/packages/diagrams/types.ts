/**
 * Strict data contracts for Architecture Diagram Visualization.
 */

export type ArchitectureDiagramType =
  | 'COMPONENT'
  | 'DATABASE_ERD'
  | 'API'
  | 'FOLDER_STRUCTURE'
  | 'MODULE'
  | 'DEPLOYMENT'
  | 'SEQUENCE'
  | 'WORKFLOW'
  | 'AGENT_COLLABORATION';

export interface ArchitectureDiagramDefinition {
  type: ArchitectureDiagramType;
  title: string;
  category: 'System' | 'Database' | 'Workflow' | 'Operations';
  description: string;
  mermaidSyntax: string;
}
