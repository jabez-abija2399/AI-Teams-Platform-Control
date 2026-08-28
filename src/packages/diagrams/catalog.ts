import type { ArchitectureDiagramDefinition, ArchitectureDiagramType } from './types';

export const DIAGRAM_CATALOG: Record<ArchitectureDiagramType, ArchitectureDiagramDefinition> = {
  COMPONENT: {
    type: 'COMPONENT',
    title: 'Component & State Architecture',
    category: 'System',
    description: 'Frontend component hierarchy, hooks, and real-time SSE ingestion flow.',
    mermaidSyntax: `graph TD
  UI[Dashboard & Studio UI] --> Hook[useGenerationStream]
  Hook --> SSE[SSE Event Stream Bus]
  SSE --> Pipeline[PipelineOrchestrator]
  Pipeline --> Monaco[Monaco Code Viewer]
  Pipeline --> AgentRoster[Agent Roster]`,
  },
  DATABASE_ERD: {
    type: 'DATABASE_ERD',
    title: 'Entity Relationship Diagram (ERD)',
    category: 'Database',
    description: 'Relational data models, foreign keys, and execution run entities.',
    mermaidSyntax: `erDiagram
  PROJECT ||--o{ PROJECT_EXECUTION : runs
  PROJECT_EXECUTION ||--o{ AGENT_RUN : contains
  PROJECT ||--o{ AGENT_MESSAGE : logs
  PROJECT ||--o{ ARTIFACT : generates
  PROJECT ||--|| AI_CREDENTIAL : uses`,
  },
  API: {
    type: 'API',
    title: 'API & Route Gateway',
    category: 'System',
    description: 'REST API routing, request validation, and stream gateways.',
    mermaidSyntax: `graph LR
  Client[Client Browser] -->|POST /api/projects| API_Projects[Projects Handler]
  Client -->|GET /api/pipeline/stream| API_Stream[SSE Token Stream]
  Client -->|POST /api/git/push| API_Git[GitHub Dispatcher]
  Client -->|GET /api/preview| API_Preview[Live Sandbox Frame]`,
  },
  FOLDER_STRUCTURE: {
    type: 'FOLDER_STRUCTURE',
    title: 'Directory & Package Layout',
    category: 'System',
    description: 'Feature-Sliced Design and package boundaries.',
    mermaidSyntax: `graph TD
  src[src Root] --> packages[packages - Reusable Core]
  src --> features[features - Domain Logic]
  src --> app[app - App Router Pages]
  packages --> ui[ui - Atomic Kit]
  packages --> theme[theme - Design Tokens]
  packages --> assets[assets - Image Generator]
  packages --> diagrams[diagrams - Mermaid Engine]`,
  },
  MODULE: {
    type: 'MODULE',
    title: 'Engine DAG & Pipeline Orchestration',
    category: 'Workflow',
    description: 'Autonomous execution graph and self-reflective pipeline stages.',
    mermaidSyntax: `graph TD
  Discovery[Product Discovery] --> SpecEngine[Specification Engine]
  SpecEngine --> AutonomousPlanner[DAG Planner]
  AutonomousPlanner --> PipelineOrchestrator[Pipeline Orchestrator]
  PipelineOrchestrator --> SelfReflectiveEngine[Debate & Code Review]`,
  },
  DEPLOYMENT: {
    type: 'DEPLOYMENT',
    title: 'CI/CD & Cloud Deployment Flow',
    category: 'Operations',
    description: 'GitHub Actions validation, type checking, and cloud sandbox deployment.',
    mermaidSyntax: `graph LR
  Source[GitHub Repository] --> CI[GitHub Actions CI/CD]
  CI --> TSC[TypeScript Strict Validation]
  CI --> Lint[ESLint Code Quality]
  CI --> Build[Next.js Production Build]
  Build --> Cloud[Live Production Sandbox]`,
  },
  SEQUENCE: {
    type: 'SEQUENCE',
    title: 'Multi-Agent Execution Sequence',
    category: 'Workflow',
    description: 'Chronological message handoffs between AI specialists.',
    mermaidSyntax: `sequenceDiagram
  autonumber
  User->>CEO: Submit Software Vision
  CEO->>ProductManager: Generate PRD & User Stories
  ProductManager->>Architect: Design System Specs
  Architect->>Developer: Generate Code Files
  Developer->>QA: Run Verification Tests
  QA->>User: Deliver Working Software`,
  },
  WORKFLOW: {
    type: 'WORKFLOW',
    title: 'Software Development Lifecycle (SDLC)',
    category: 'Workflow',
    description: 'Step-by-step lifecycle from idea conception to deployment.',
    mermaidSyntax: `graph TD
  Idea[Software Idea] --> SRS[SRS Approved]
  SRS --> DAG[DAG Plan Generated]
  DAG --> TaskQueue[Task Queue Dispatched]
  TaskQueue --> CodeGen[Alex Writes Code]
  CodeGen --> Debate[Marcus Reviews Tradeoffs]
  Debate --> LiveApp[Production Live Preview]`,
  },
  AGENT_COLLABORATION: {
    type: 'AGENT_COLLABORATION',
    title: 'Autonomous Agent Roster & Roles',
    category: 'System',
    description: 'Organization structure and specialized department communication paths.',
    mermaidSyntax: `graph TD
  CEO[Sarah - CEO / Strategy] --> Architect[Marcus - System Architect]
  Architect --> Designer[Elena - UI/UX Designer]
  Architect --> Developer[Alex - Lead Developer]
  Designer --> Developer
  Developer --> QA[Maya - QA & Security]`,
  },
};

export class ArchitectureDiagramCatalog {
  public static getAllDiagrams(): ArchitectureDiagramDefinition[] {
    return Object.values(DIAGRAM_CATALOG);
  }

  public static getDiagram(type: ArchitectureDiagramType): ArchitectureDiagramDefinition {
    return DIAGRAM_CATALOG[type] || DIAGRAM_CATALOG.COMPONENT;
  }
}
