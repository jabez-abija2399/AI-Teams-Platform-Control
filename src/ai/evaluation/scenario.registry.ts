import type { EvaluationScenario } from './evaluation.types';

const scenarios = new Map<string, EvaluationScenario>([
  [
    'portfolio_website',
    {
      id: 'portfolio_website',
      name: 'Scenario 1 — Portfolio Website',
      description: 'Create a personal portfolio website with projects section, about page, dark mode, and responsive design.',
      input: 'Create a personal portfolio website.\n\nRequirements:\n- Modern UI\n- Projects section\n- About page\n- Contact form\n- Dark mode\n- Mobile responsive',
      expectedWorkflow: 'SIMPLE_WEBSITE',
      expectedAgents: ['CEO', 'FRONTEND', 'QA'],
      steps: [
        { stepId: 'ceo_vision', expectedAgent: 'CEO', requiredOutputKeys: ['vision', 'targetAudience'] },
        { stepId: 'frontend_implementation', expectedAgent: 'FRONTEND', requiredOutputKeys: ['code', 'uiQuality'] },
        { stepId: 'qa_review', expectedAgent: 'QA', requiredOutputKeys: ['testReport', 'accessibility'] },
      ],
      validationCriteria: {
        checkCorrectAgentSelection: true,
        checkNoUnnecessaryAgents: true,
        checkSecurityBoundaries: true,
      },
    },
  ],
  [
    'saas_platform',
    {
      id: 'saas_platform',
      name: 'Scenario 2 — SaaS Platform',
      description: 'Create an inventory management SaaS with authentication, roles, stock tracking, reports, dashboard, and notifications.',
      input: 'Create an inventory management SaaS.\n\nFeatures:\n- Authentication\n- Roles\n- Products\n- Stock tracking\n- Reports\n- Dashboard\n- Notifications',
      expectedWorkflow: 'LARGE_SAAS',
      expectedAgents: ['CEO', 'PRODUCT_MANAGER', 'ARCHITECT', 'DATABASE', 'BACKEND', 'FRONTEND', 'SECURITY', 'QA', 'DEVOPS'],
      steps: [
        { stepId: 'ceo_vision', expectedAgent: 'CEO' },
        { stepId: 'pm_requirements', expectedAgent: 'PRODUCT_MANAGER' },
        { stepId: 'architecture_design', expectedAgent: 'ARCHITECT' },
        { stepId: 'database_design', expectedAgent: 'DATABASE' },
        { stepId: 'backend_implementation', expectedAgent: 'BACKEND' },
        { stepId: 'frontend_implementation', expectedAgent: 'FRONTEND' },
        { stepId: 'security_audit', expectedAgent: 'SECURITY' },
        { stepId: 'qa_review', expectedAgent: 'QA' },
        { stepId: 'devops_deploy', expectedAgent: 'DEVOPS' },
      ],
      validationCriteria: {
        checkCorrectAgentSelection: true,
        checkNoUnnecessaryAgents: true,
        checkSecurityBoundaries: true,
      },
    },
  ],
  [
    'failure_recovery',
    {
      id: 'failure_recovery',
      name: 'Scenario 3 — Failure Recovery',
      description: 'Test self-correction when developer creates authentication without validation.',
      input: 'Developer creates authentication without validation.',
      expectedWorkflow: 'RECOVERY_TEST',
      expectedAgents: ['DEVELOPER', 'QA'],
      steps: [
        { stepId: 'dev_attempt_1', expectedAgent: 'DEVELOPER' },
        { stepId: 'qa_detects', expectedAgent: 'QA' },
        { stepId: 'dev_fix', expectedAgent: 'DEVELOPER' },
        { stepId: 'qa_approve', expectedAgent: 'QA' },
      ],
      validationCriteria: {
        checkCorrectAgentSelection: true,
        checkNoUnnecessaryAgents: true,
        checkSecurityBoundaries: true,
        checkSelfCorrection: true,
      },
    },
  ],
]);

export function getScenario(id: string): EvaluationScenario | undefined {
  return scenarios.get(id);
}

export function getAllScenarios(): EvaluationScenario[] {
  return Array.from(scenarios.values());
}
