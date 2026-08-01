import type { WorkflowDefinition } from './workflow.types';

const workflows = new Map<string, WorkflowDefinition>();

export function registerWorkflow(workflow: WorkflowDefinition): void {
  workflows.set(workflow.id, workflow);
}

export function getWorkflow(id: string): WorkflowDefinition | undefined {
  return workflows.get(id);
}

export function getAllWorkflows(): WorkflowDefinition[] {
  return Array.from(workflows.values());
}

// Preset Workflow 1: Simple Website (CEO -> FRONTEND -> QA)
registerWorkflow({
  id: 'SIMPLE_WEBSITE',
  name: 'Simple Website Workflow',
  description: 'Fast 3-step workflow for landing pages and simple frontend web apps.',
  initialStep: 'ceo_vision',
  steps: {
    ceo_vision: {
      step: 'ceo_vision',
      agent: 'CEO',
      taskTitle: 'Analyze Idea and Define Simple Website Scope',
      taskType: 'PRODUCT_VISION',
      next: 'frontend_implementation',
      retryLimit: 3,
      inputTransformer: (_, init) => init,
    },
    frontend_implementation: {
      step: 'frontend_implementation',
      agent: 'FRONTEND',
      taskTitle: 'Implement Responsive Website UI/UX',
      taskType: 'CODE_GENERATION',
      next: 'qa_review',
      retryLimit: 3,
      inputTransformer: (results, init) => ({ initialIdea: init, ceoResult: results['ceo_vision'] }),
    },
    qa_review: {
      step: 'qa_review',
      agent: 'QA',
      taskTitle: 'Verify Website UI/UX and Responsiveness',
      taskType: 'QUALITY_REPORT',
      retryLimit: 3,
      inputTransformer: (results) => ({ frontendCode: results['frontend_implementation'] }),
    },
  },
});

// Preset Workflow 2: Large SaaS (CEO -> PM -> ARCHITECT -> FRONTEND -> BACKEND -> DATABASE -> SECURITY -> QA -> DEVOPS)
registerWorkflow({
  id: 'LARGE_SAAS',
  name: 'Enterprise Large SaaS Workflow',
  description: 'Complete 9-step autonomous software company pipeline with specialist engineers.',
  initialStep: 'ceo_vision',
  steps: {
    ceo_vision: {
      step: 'ceo_vision',
      agent: 'CEO',
      taskTitle: 'Define SaaS Product Vision and Strategic Plan',
      taskType: 'PRODUCT_VISION',
      next: 'pm_requirements',
      retryLimit: 3,
      inputTransformer: (_, init) => init,
    },
    pm_requirements: {
      step: 'pm_requirements',
      agent: 'PRODUCT_MANAGER',
      taskTitle: 'Refine Requirements and User Stories',
      taskType: 'REFINED_REQUIREMENTS',
      next: 'architecture_design',
      retryLimit: 3,
      inputTransformer: (results) => results['ceo_vision'],
    },
    architecture_design: {
      step: 'architecture_design',
      agent: 'ARCHITECT',
      taskTitle: 'Design Complete SaaS Architecture and Database Schema',
      taskType: 'TECHNICAL_ARCHITECTURE',
      next: 'database_design',
      retryLimit: 3,
      inputTransformer: (results) => results['pm_requirements'],
    },
    database_design: {
      step: 'database_design',
      agent: 'DATABASE',
      taskTitle: 'Optimize Prisma Schema and Migration Plan',
      taskType: 'DATABASE_DESIGN',
      next: 'backend_implementation',
      retryLimit: 3,
      inputTransformer: (results) => results['architecture_design'],
    },
    backend_implementation: {
      step: 'backend_implementation',
      agent: 'BACKEND',
      taskTitle: 'Implement Secure API Endpoints and Business Logic',
      taskType: 'CODE_GENERATION',
      next: 'frontend_implementation',
      retryLimit: 3,
      inputTransformer: (results) => ({ arch: results['architecture_design'], db: results['database_design'] }),
    },
    frontend_implementation: {
      step: 'frontend_implementation',
      agent: 'FRONTEND',
      taskTitle: 'Implement Responsive SaaS Dashboard UI Components',
      taskType: 'CODE_GENERATION',
      next: 'security_audit',
      retryLimit: 3,
      inputTransformer: (results) => ({ arch: results['architecture_design'], backend: results['backend_implementation'] }),
    },
    security_audit: {
      step: 'security_audit',
      agent: 'SECURITY',
      taskTitle: 'Conduct Security and Vulnerability Audit',
      taskType: 'SECURITY_AUDIT',
      next: 'qa_review',
      retryLimit: 3,
      inputTransformer: (results) => ({ backend: results['backend_implementation'], frontend: results['frontend_implementation'] }),
    },
    qa_review: {
      step: 'qa_review',
      agent: 'QA',
      taskTitle: 'Execute Test Cases and Verify Acceptance Criteria',
      taskType: 'QUALITY_REPORT',
      next: 'devops_deploy',
      retryLimit: 3,
      inputTransformer: (results) => ({ security: results['security_audit'], backend: results['backend_implementation'], frontend: results['frontend_implementation'] }),
    },
    devops_deploy: {
      step: 'devops_deploy',
      agent: 'DEVOPS',
      taskTitle: 'Generate CI/CD Pipeline and Deployment Configurations',
      taskType: 'DEPLOYMENT_PLAN',
      retryLimit: 3,
      inputTransformer: (results) => ({ arch: results['architecture_design'], qa: results['qa_review'] }),
    },
  },
});
