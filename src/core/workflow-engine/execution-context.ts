export interface ExecutionContext {
  projectId: string;
  userIdea: string;
  
  /**
   * The Product Requirements Document (PRD) output from the PlanningNode (PM).
   */
  prd?: any;
  
  /**
   * The System Architecture output from the ArchitectureNode (Architect).
   */
  architecture?: any;
  
  /**
   * The Design System and Component Hierarchy from the DesignNode (UI Designer).
   */
  design?: any;
  
  /**
   * The execution summary from the ExecutionNode (Developer).
   */
  execution?: any;

  /**
   * Output from the DebateNode (Architect Code Review).
   */
  debate?: any;
  
  /**
   * Internal pipeline metadata (e.g., retries, errors).
   */
  metadata: {
    startTime: number;
    errors: Array<{ node: string; message: string; timestamp: number }>;
    attempts: Record<string, number>;
  };
}
