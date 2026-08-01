import { ArchitectureDiagram, ArchitectureDiagramType } from './types';

export class ArchitectureVisualizer {
  /**
   * Generates Mermaid diagram syntax and SVG markup for the specified architecture diagram type
   */
  public static generateDiagram(type: ArchitectureDiagramType, title?: string): ArchitectureDiagram {
    let mermaidSyntax = '';

    switch (type) {
      case 'COMPONENT':
        mermaidSyntax = `graph TD\n  UI[Dashboard UI] --> Hook[useAIBuildStream]\n  Hook --> SSE[SSE / Event Stream]\n  SSE --> Pipeline[PipelineOrchestrator]\n  Pipeline --> Engine[AgentExecutionEngine]`;
        break;
      case 'DATABASE_ERD':
        mermaidSyntax = `erDiagram\n  PROJECT ||--o{ PROJECT_EXECUTION : has\n  PROJECT_EXECUTION ||--o{ AGENT_RUN : contains\n  PROJECT ||--o{ AGENT_MESSAGE : logs`;
        break;
      case 'API':
        mermaidSyntax = `graph LR\n  Client -->|GET /api/projects| API_Projects[Projects Handler]\n  Client -->|GET /api/observability| API_Obs[Observability Handler]`;
        break;
      case 'FOLDER_STRUCTURE':
        mermaidSyntax = `graph TD\n  src --> features\n  src --> core\n  core --> execution-engine\n  core --> specification\n  core --> planner`;
        break;
      case 'MODULE':
        mermaidSyntax = `graph TD\n  SpecificationEngine --> AutonomousPlanner\n  AutonomousPlanner --> PipelineOrchestrator\n  PipelineOrchestrator --> SelfReflectiveEngine`;
        break;
      case 'DEPLOYMENT':
        mermaidSyntax = `graph LR\n  Source[GitHub Repo] --> CI[GitHub Actions]\n  CI --> Docker[Docker Image]\n  Docker --> Cloud[E2B Cloud Sandbox]`;
        break;
      case 'SEQUENCE':
        mermaidSyntax = `sequenceDiagram\n  User->>Platform: Submit Project Idea\n  Platform->>SpecEngine: Generate SRS\n  SpecEngine->>Planner: Create Execution DAG\n  Planner->>Agents: Execute Tasks`;
        break;
      case 'WORKFLOW':
        mermaidSyntax = `graph TD\n  Idea --> SRS_Approved --> DAG_Plan --> Task_Queue --> Execution --> Self_Healing --> Live_App`;
        break;
      case 'AGENT_COLLABORATION':
        mermaidSyntax = `graph TD\n  CEO[Sarah - CEO] --> Architect[Marcus - Architect]\n  Architect --> DB[Elena - DB]\n  DB --> Backend[David - Backend]\n  Backend --> Frontend[Chloe - Frontend]\n  Frontend --> QA[James - QA]`;
        break;
    }

    const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300"><rect width="100%" height="100%" fill="#0f172a"/><text x="20" y="40" fill="#38bdf8" font-family="monospace" font-size="16" font-weight="bold">${title || type} Diagram</text><text x="20" y="80" fill="#94a3b8" font-family="sans-serif" font-size="12">${mermaidSyntax.replace(/\n/g, ' | ')}</text></svg>`;

    return {
      type,
      title: title || `${type} Architecture Diagram`,
      mermaidSyntax,
      svgMarkup,
      updatedAt: new Date().toISOString(),
    };
  }

  public static generateAllDiagrams(): ArchitectureDiagram[] {
    const types: ArchitectureDiagramType[] = [
      'COMPONENT',
      'DATABASE_ERD',
      'API',
      'FOLDER_STRUCTURE',
      'MODULE',
      'DEPLOYMENT',
      'SEQUENCE',
      'WORKFLOW',
      'AGENT_COLLABORATION',
    ];

    return types.map((t) => this.generateDiagram(t));
  }
}
