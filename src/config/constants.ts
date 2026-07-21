export const APP_NAME = 'AI Teams Platform';

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  projects: '/dashboard/projects',
  aiTeams: '/dashboard/ai-teams',
  settings: '/dashboard/settings',
} as const;

export const PROJECT_STATUS = {
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEW: 'REVIEW',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;

export const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  BLOCKED: 'BLOCKED',
} as const;

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export const AGENT_ROLE = {
  CEO: 'CEO',
  ARCHITECT: 'ARCHITECT',
  DEVELOPER: 'DEVELOPER',
  QA: 'QA',
} as const;
