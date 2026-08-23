/**
 * Project Type & Capability Taxonomy
 * 
 * Formal separation of Project Intent from Technology Stack.
 */

export type ProjectType =
  | 'FRONTEND_ONLY'
  | 'BACKEND_ONLY'
  | 'FULL_STACK'
  | 'MOBILE'
  | 'API'
  | 'LIBRARY'
  | 'CLI';

export interface ProjectCapabilities {
  frontend: boolean;
  backend: boolean;
  database: boolean;
  authentication: boolean;
  realtime: boolean;
  backgroundJobs: boolean;
  mobile: boolean;
}

export const PROJECT_TYPE_DEFAULT_CAPABILITIES: Record<ProjectType, ProjectCapabilities> = {
  FRONTEND_ONLY: {
    frontend: true,
    backend: false,
    database: false,
    authentication: false,
    realtime: false,
    backgroundJobs: false,
    mobile: false,
  },
  BACKEND_ONLY: {
    frontend: false,
    backend: true,
    database: true,
    authentication: true,
    realtime: false,
    backgroundJobs: false,
    mobile: false,
  },
  API: {
    frontend: false,
    backend: true,
    database: true,
    authentication: true,
    realtime: false,
    backgroundJobs: false,
    mobile: false,
  },
  FULL_STACK: {
    frontend: true,
    backend: true,
    database: true,
    authentication: true,
    realtime: false,
    backgroundJobs: false,
    mobile: false,
  },
  MOBILE: {
    frontend: true,
    backend: true,
    database: true,
    authentication: true,
    realtime: false,
    backgroundJobs: false,
    mobile: true,
  },
  LIBRARY: {
    frontend: false,
    backend: false,
    database: false,
    authentication: false,
    realtime: false,
    backgroundJobs: false,
    mobile: false,
  },
  CLI: {
    frontend: false,
    backend: true,
    database: false,
    authentication: false,
    realtime: false,
    backgroundJobs: false,
    mobile: false,
  },
};

/**
 * Classify project type from user prompt and requirements.
 */
export function classifyProjectType(idea: string, hints?: { projectType?: string }): ProjectType {
  if (hints?.projectType) {
    const norm = hints.projectType.toUpperCase().replace(/[\s-]/g, '_');
    if (['FRONTEND_ONLY', 'BACKEND_ONLY', 'FULL_STACK', 'MOBILE', 'API', 'LIBRARY', 'CLI'].includes(norm)) {
      return norm as ProjectType;
    }
  }

  const lower = idea.toLowerCase();

  if (/\b(only frontend|frontend only|just the ui|landing page|static site|static page|html.?css)\b/.test(lower) && !/\b(backend|database|api server|auth server)\b/.test(lower)) {
    return 'FRONTEND_ONLY';
  }

  if (/\b(only backend|backend only|rest api|graphql api|api server|fastapi service|backend service)\b/.test(lower) && !/\b(frontend|ui|landing page|website)\b/.test(lower)) {
    return 'BACKEND_ONLY';
  }

  if (/\b(mobile app|react native|expo app|ios and android)\b/.test(lower)) {
    return 'MOBILE';
  }

  if (/\b(cli tool|command line tool|npm package|library)\b/.test(lower)) {
    return 'CLI';
  }

  return 'FULL_STACK';
}
