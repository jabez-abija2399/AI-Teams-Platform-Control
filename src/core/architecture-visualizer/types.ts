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

export interface ArchitectureDiagram {
  type: ArchitectureDiagramType;
  title: string;
  mermaidSyntax: string;
  svgMarkup: string;
  updatedAt: string;
}
