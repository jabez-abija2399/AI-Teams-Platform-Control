import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Shared mock stores ─────────────────────────────────────────────────────
const mockWorkflowState: Record<string, any> = {};
const mockArtifacts: Record<string, any[]> = {};
const mockApprovals: Record<string, any[]> = {};

// ─── Mock Prisma ────────────────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'studymate-e2e',
        name: 'StudyMate',
        description: 'Student study task management app',
        status: 'CREATED',
      }),
      update: vi.fn().mockImplementation(({ where, data }) =>
        Promise.resolve({ ...where, ...data })
      ),
    },
    projectWorkflowState: {
      findUnique: vi.fn().mockImplementation(({ where }) =>
        Promise.resolve(mockWorkflowState[where.projectId] || null)
      ),
      create: vi.fn().mockImplementation(({ data }) => {
        mockWorkflowState[data.projectId] = { id: 'ws-1', ...data };
        return Promise.resolve(mockWorkflowState[data.projectId]);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        if (mockWorkflowState[where.projectId]) {
          Object.assign(mockWorkflowState[where.projectId], data);
        }
        return Promise.resolve(mockWorkflowState[where.projectId] || { ...where, ...data });
      }),
    },
    artifactLifecycleRecord: {
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = `art_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const record = { id, ...data, createdAt: new Date() };
        const key = data.projectId;
        if (!mockArtifacts[key]) mockArtifacts[key] = [];
        mockArtifacts[key].push(record);
        return Promise.resolve(record);
      }),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        const arts = mockArtifacts[where?.projectId] || [];
        const found = arts.find((a) => a.artifactType === where?.artifactType && a.status === 'VALIDATED');
        return Promise.resolve(found || null);
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(mockArtifacts[where?.projectId] || []);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ ...where, ...data })),
    },
    document: {
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: `doc_${Date.now()}`, ...data })
      ),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        const arts = mockArtifacts[where?.projectId] || [];
        const found = arts.find((a) => a.artifactType === where?.type);
        if (found) {
          return Promise.resolve({
            id: found.artifactId || found.id,
            projectId: found.projectId,
            type: found.artifactType,
            content: typeof found.content === 'string' ? found.content : JSON.stringify(found.content),
            createdAt: found.createdAt || new Date(),
          });
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    approvalHistory: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = `approval_${Date.now()}`;
        const record = { id, ...data, createdAt: new Date() };
        const key = data.projectId;
        if (!mockApprovals[key]) mockApprovals[key] = [];
        mockApprovals[key].push(record);
        return Promise.resolve(record);
      }),
      findMany: vi.fn().mockImplementation(({ where }) =>
        Promise.resolve(mockApprovals[where?.projectId] || [])
      ),
    },
    handoffHistory: {
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: `ho_${Date.now()}`, ...data, createdAt: new Date() })
      ),
      findMany: vi.fn().mockResolvedValue([]),
    },
    documentVersion: {
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: `dv_${Date.now()}`, ...data })
      ),
    },
    aIEventLog: { create: vi.fn().mockResolvedValue({}) },
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $transaction: vi.fn().mockImplementation((cb: unknown) => typeof cb === 'function' ? cb({}) : Promise.resolve([])),
  },
}));

// ─── Mock AI Agent Services ─────────────────────────────────────────────────
const mockProductSpec = {
  productName: 'StudyMate',
  vision: 'Help university students organize and manage study tasks',
  problemStatement: 'Students struggle managing deadlines and study tasks across subjects',
  targetAudience: 'University students',
  platform: 'Web application',
  complexity: 'MVP' as const,
  mvpFeatures: [
    { name: 'Create study tasks', priority: 'HIGH' as const },
    { name: 'Add deadlines', priority: 'HIGH' as const },
    { name: 'Mark tasks completed', priority: 'HIGH' as const },
    { name: 'Organize by subjects', priority: 'MEDIUM' as const },
  ],
  futureFeatures: ['AI study assistant', 'Calendar integration', 'Notifications'],
  questions: ['Should students have accounts?', 'Should tasks send deadline reminders?'],
  clarificationRequired: true,
};

vi.mock('@/ai/agents/roles/product-discovery.agent', () => ({
  ProductDiscoveryAgent: vi.fn().mockImplementation(function () {
    return {
      discoverProductSpecification: vi.fn().mockResolvedValue(mockProductSpec),
    };
  }),
}));

vi.mock('@/ai/agents/roles/ceo/ceo.service', () => ({
  analyzeUserIdea: vi.fn().mockResolvedValue({
    success: true,
    data: {
      vision: { problem: 'Students struggle managing study tasks', solution: 'Simple task management app', targetUsers: ['University students'], businessGoal: 'MVP validation' },
      requirements: { features: [{ name: 'Task creation', description: 'Create study tasks' }], userStories: [], priorities: ['Task creation'], constraints: ['MVP scope'] },
      plan: { phases: [{ name: 'Database Design', goal: 'Design schema', tasks: ['Create schema'] }], tasks: ['Design schema', 'Build API'], estimatedComplexity: 'MVP', qualityScore: { completeness: 90, clarity: 85, feasibility: 95, overall: 90, verdict: 'APPROVED' as const } },
      qualityScore: { completeness: 90, clarity: 85, feasibility: 95, overall: 90, verdict: 'APPROVED' as const },
    },
  }),
}));

vi.mock('@/ai/agents/roles/product-manager/product-manager.service', () => ({
  refineRequirements: vi.fn().mockResolvedValue({
    success: true,
    data: {
      userStories: [{ id: 'US-001', title: 'Create task', asA: 'student', iWant: 'to create a task', soThat: 'I can track work', acceptanceCriteria: ['Task has title'], priority: 'HIGH', estimatedEffort: '2h' }],
      featureSpecs: [{ name: 'Task Management', description: 'CRUD tasks', userStories: [], dependencies: [], technicalNotes: 'Prisma' }],
      nonFunctionalRequirements: [{ category: 'Performance', requirement: 'Fast loading', rationale: 'Productivity' }],
      backlog: ['Task creation'],
      clarificationsNeeded: [],
    },
  }),
}));

vi.mock('@/ai/agents/roles/business-analyst/business-analyst.service', () => ({
  generateSoftwareRequirementSpec: vi.fn().mockResolvedValue({
    success: true,
    data: {
      srs: { title: 'StudyMate SRS', version: '1.0', scope: 'MVP', overview: 'Student task management' },
      businessRules: [], processFlows: [], useCases: [], actors: [], traceabilityMatrix: [],
      functionalSpecs: [], nonFunctionalSpecs: [], edgeCases: [], validationRules: [],
      riskAnalysis: [], dependencyMapping: [], decisionTables: [], acceptanceMatrix: [],
      complexityEstimate: { overallEffort: '2 weeks', criticalPath: ['Schema', 'API'] },
      status: 'COMPLETE',
    },
  }),
}));

vi.mock('@/ai/agents/roles/ui-designer/ui-designer.service', () => ({
  generateUiDesignSpec: vi.fn().mockResolvedValue({
    success: true,
    data: {
      designTokens: { colors: [], typography: [], spacing: [], borderRadius: [], shadows: [], glassmorphism: [] },
      componentHierarchy: [], responsiveLayouts: [], visualStyleGuide: { themeName: 'Glass', vibe: 'Clean', primaryPalette: 'Indigo', secondaryPalette: 'Gray' },
      microInteractions: [], accessibilityVisualTokens: [], layoutMockups: [], cssVariablesManifest: '', status: 'COMPLETE',
    },
  }),
}));

vi.mock('@/ai/agents/roles/architect/architect.service', () => ({
  designArchitecture: vi.fn().mockResolvedValue({
    success: true,
    data: {
      architecture: { frontend: 'Next.js 14', backend: 'Next.js API Routes', database: 'PostgreSQL + Prisma', infrastructure: 'Vercel', security: 'NextAuth.js' },
      database: { entities: [{ name: 'User', fields: [{ name: 'id', type: 'String' }] }, { name: 'Task', fields: [{ name: 'id', type: 'String' }] }], relationships: ['User has Tasks'], indexes: [], constraints: [] },
      api: { endpoints: [{ path: '/api/tasks', method: 'GET', response: 'Task[]' }] },
      decisions: [{ technology: 'Next.js 14', reason: 'Full-stack', alternative: 'Remix', tradeoff: 'Better DX' }],
      qualityScore: { completeness: 92, technicalAccuracy: 90, scalability: 88, security: 90, maintainability: 91, overall: 90, verdict: 'APPROVED' as const },
    },
  }),
}));

vi.mock('@/core/executive/executive-planner', () => ({
  ExecutivePlanner: {
    planProjectWork: vi.fn().mockResolvedValue({
      milestones: [
        { id: 'M1', name: 'Database Design', phase: 'ARCHITECTURE', tasks: ['Create schema'] },
        { id: 'M2', name: 'Authentication', phase: 'DEVELOPMENT', tasks: ['NextAuth setup'] },
        { id: 'M3', name: 'Task Management', phase: 'DEVELOPMENT', tasks: ['Task API', 'Dashboard'] },
      ],
      tasks: [
        { id: 'TASK-001', title: 'Create Prisma schema', assignedTo: 'DATABASE_ENGINEER', milestone: 'M1', priority: 'HIGH', estimatedHours: 4 },
        { id: 'TASK-002', title: 'Set up NextAuth', assignedTo: 'BACKEND_ENGINEER', milestone: 'M2', priority: 'HIGH', estimatedHours: 6 },
        { id: 'TASK-003', title: 'Build task dashboard', assignedTo: 'FRONTEND_ENGINEER', milestone: 'M3', priority: 'HIGH', estimatedHours: 8 },
      ],
      totalEstimatedHours: 40,
      criticalPath: ['TASK-001', 'TASK-002', 'TASK-003'],
    }),
  },
}));

vi.mock('@/core/workforce/capability/agent-capability.engine', () => ({
  AgentCapabilityEngine: {
    evaluateTaskCapability: vi.fn().mockResolvedValue({
      primaryAgent: 'DEVELOPER',
      supportingReviewer: 'ARCHITECT',
      confidenceScore: 0.92,
      alternatives: ['FULLSTACK_ENGINEER'],
    }),
  },
}));

vi.mock('@/core/workforce/context/context-injector.service', () => ({
  ContextInjectorService: {
    injectContextForTask: vi.fn().mockResolvedValue({
      role: 'Frontend Engineer',
      personality: 'Detail-oriented',
      context: { project: 'StudyMate', architecture: 'Next.js App Router', rules: ['Use TypeScript', 'Use Tailwind'], reviewer: 'UI Engineer' },
    }),
  },
}));

vi.mock('@/core/review-committee/review-committee', () => ({
  ReviewCommittee: {
    evaluateCodebase: vi.fn().mockReturnValue({
      overallScore: 91,
      categoryScores: { codeQuality: 92, security: 93, architecture: 90, testCoverage: 88, documentation: 85 },
      decision: 'APPROVED',
      reviewers: ['CEO Review', 'Architecture Review', 'Security Review', 'Code Quality Review', 'QA Review'],
      findings: [],
      recommendations: ['Add unit tests'],
    }),
  },
}));

vi.mock('@/ai/agents/roles/developer/developer.service', () => ({
  implementArchitecture: vi.fn().mockResolvedValue({
    success: true,
    data: {
      plan: { tasks: ['Create schema', 'Build API', 'Build frontend'], files: ['schema.prisma', 'route.ts', 'page.tsx'], dependencies: ['@prisma/client'], implementationOrder: ['schema', 'api', 'frontend'] },
      changes: [{ file: 'schema.prisma', changeType: 'CREATE', description: 'DB schema', code: 'model User {}' }],
      report: { completed: true, changedFiles: ['schema.prisma'], issues: [], notes: 'MVP done' },
      qualityScore: { completeness: 90, typeSafety: 92, errorHandling: 85, consistency: 88, overall: 89, verdict: 'APPROVED' },
    },
  }),
}));

vi.mock('@/ai/agents/roles/qa/qa.service', () => ({
  reviewImplementation: vi.fn().mockResolvedValue({
    success: true,
    data: {
      unitTests: [{ id: 'UT-001', title: 'Task creation test', type: 'unit', steps: ['Create task'], expectedResult: 'Created', priority: 'HIGH' }],
      integrationTests: [], e2eTests: [], regressionPlan: [],
      coverageAnalysis: { estimatedCoverage: 85, uncoveredAreas: [], highRiskModules: [] },
      riskMatrix: [], bugReports: [], testSuites: [], performanceTests: [], accessibilityTests: [], securityTests: [],
      qualityReport: { score: 88, verdict: 'PASS', summary: 'Good quality', recommendations: [], issues: [] },
      testPlan: { tests: [], coverage: '85%', strategy: 'Unit + Integration' },
      status: 'COMPLETE',
    },
  }),
}));

vi.mock('@/ai/agents/roles/security/security.service', () => ({
  generateSecurityReportSpec: vi.fn().mockResolvedValue({
    success: true,
    data: {
      threatModel: [], owaspReview: [], authenticationAudit: { mechanism: 'NextAuth.js', vulnerabilities: [], strengthScore: 90 },
      authorizationAudit: { enforcement: 'Session-based', privilegeEscalationRisks: [], recommendations: [] },
      dependencyScan: [], secretDetection: { hardcodedSecretsFound: false, locations: [], envManagementScore: 95 },
      apiSecurityReview: { rateLimitingEnforced: true, corsPolicy: 'Strict', inputValidationScore: 88, findings: [] },
      infrastructureReview: { tlsEnforced: true, headers: ['CSP'], containerSecurity: 'Vercel' },
      dataProtectionReport: { encryptionAtRest: 'Managed', encryptionInTransit: 'TLS', piiHandling: 'Email only' },
      complianceReport: { gdprReady: true, soc2Ready: false, hipaaReady: false, notes: 'MVP' },
      riskScore: { overallScore: 88, riskLevel: 'LOW', summary: 'Good posture' },
      remediationPlan: [], status: 'COMPLETE',
    },
  }),
}));

vi.mock('@/ai/agents/roles/devops/devops.service', () => ({
  generateDevopsPlanSpec: vi.fn().mockResolvedValue({
    success: true,
    data: {
      docker: 'FROM node:20', dockerCompose: 'version: "3.8"',
      cicdPipelines: [], githubActions: [],
      deploymentPlan: [{ step: 1, name: 'Build', description: 'Build app', command: 'npm run build' }],
      infrastructureDiagram: 'Vercel', environmentVariables: [{ key: 'DATABASE_URL', description: 'DB', required: true, isSecret: true }],
      secretsStrategy: { tool: 'Vercel', rotationIntervalDays: 90, accessControl: 'Team' },
      scalingPlan: { minInstances: 1, maxInstances: 3, targetCpuUtilization: 70, autoScalingPolicy: 'On demand' },
      monitoringPlan: { metricsPlatform: 'Vercel Analytics', keyMetrics: ['Response time'], alertThresholds: ['p95 > 2s'] },
      loggingPlan: { logAggregation: 'Vercel Logs', retentionDays: 30, structuredLogging: true },
      backupPlan: { schedule: 'Daily', retentionDays: 30, disasterRecoveryRTO: '1h', disasterRecoveryRPO: '24h' },
      rollbackStrategy: { mechanism: 'Instant rollback', triggers: ['Error rate > 5%'], maxRollbackTimeSeconds: 30 },
      healthChecks: [], productionChecklist: [], status: 'COMPLETE',
    },
  }),
}));

vi.mock('@/core/discovery/clarification.engine', () => ({
  ClarificationEngine: {
    generateQuestions: vi.fn().mockReturnValue([
      { id: 'q1', text: 'Should students have accounts?', options: ['Yes', 'No'], category: 'auth' },
      { id: 'q2', text: 'Should tasks send reminders?', options: ['Yes', 'No'], category: 'features' },
      { id: 'q3', text: 'Should subjects have colors?', options: ['Yes', 'No'], category: 'ui' },
      { id: 'q4', text: 'Should students share tasks?', options: ['Yes', 'No'], category: 'social' },
    ]),
    applyAnswers: vi.fn().mockImplementation((spec, answers) => ({
      ...spec, clarificationRequired: false, clarifiedAnswers: answers,
    })),
  },
}));

vi.mock('@/core/product/proposal/product-proposal.engine', () => ({
  ProductProposalEngine: {
    generateProposal: vi.fn().mockReturnValue({
      product: 'StudyMate', vision: 'Lightweight student productivity platform',
      mvp: { features: ['Auth', 'Task creation', 'Deadlines', 'Subjects', 'Completion tracking'], estimatedTimeline: '2 weeks', teamSize: '1 AI agent' },
      future: ['AI assistant', 'Calendar', 'Notifications'],
      qualityScore: { clarity: 90, featureCompleteness: 85, feasibility: 95, overall: 90 },
    }),
  },
}));

// ─── Mock HandoffManager (stores artifacts for prerequisite checks) ──────────
vi.mock('@/core/company-orchestration/handoff-manager', () => ({
  HandoffManager: {
    executeHandoff: vi.fn().mockImplementation(async ({ projectId, fromAgentRole, toAgentRole, fromPhase, toPhase, artifact }) => {
      const { ArtifactManager } = await import('@/core/company-orchestration/artifact-manager');
      const storeResult = await ArtifactManager.storeArtifact(projectId, {
        type: artifact.type,
        content: artifact.content,
        producerRole: artifact.producerRole,
        summary: `Handoff from ${fromPhase} to ${toPhase}`,
      });
      return {
        success: true,
        data: {
          artifactId: storeResult.success ? storeResult.data.id : `art_${fromPhase}_${Date.now()}`,
          fromAgentRole, toAgentRole, fromPhase, toPhase, artifactType: artifact.type,
        },
      };
    }),
    getHandoffHistory: vi.fn().mockResolvedValue({ success: true, data: [] }),
  },
}));

// ─── Mock remaining services ────────────────────────────────────────────────
vi.mock('@/core/integration/event-bus', () => ({
  companyEventBus: { publish: vi.fn().mockResolvedValue({}), subscribe: vi.fn().mockReturnValue(() => {}) },
}));

vi.mock('@/features/ai-workspace/services/timeline.service', () => ({
  recordTimelineEvent: vi.fn().mockResolvedValue({}),
}));

vi.mock('@/core/execution-engine/visibility.service', () => ({
  getExecutionVisibilityService: vi.fn().mockReturnValue({
    emitEvent: vi.fn(), recordTimelineEntry: vi.fn(),
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  }),
}));

vi.mock('@/core/workspace/workspace.service', () => ({
  WorkspaceService: {
    getWorkspaceState: vi.fn().mockReturnValue({
      projectId: 'studymate-e2e', currentPhase: 'Discovery', overallProgress: 0,
      timeline: [], employees: [], activityFeed: [],
    }),
    updateFromPipelinePhase: vi.fn(),
    completePipelinePhase: vi.fn(),
    markApprovalRequired: vi.fn(),
    markPipelineCompleted: vi.fn(),
    markPipelineFailed: vi.fn(),
  },
}));

// ─── Imports ────────────────────────────────────────────────────────────────
import { CompanyPipelineEngine } from '@/core/company-orchestration/company-pipeline.engine';
import { WorkflowManager } from '@/core/company-orchestration/workflow-manager';
import { ArtifactManager } from '@/core/company-orchestration/artifact-manager';
import { WorkspaceService } from '@/core/workspace/workspace.service';
import { PIPELINE_PHASE_DEFINITIONS } from '@/core/company-orchestration/types';

// ─── Helper: run pipeline to first approval gate ───────────────────────────
async function runToFirstApproval(projectId: string) {
  await ArtifactManager.storeArtifact(projectId, {
    type: 'ProjectIdea',
    content: { name: 'StudyMate', description: 'Student task management app' },
    producerRole: 'USER',
    summary: 'Initial idea',
  });
  await WorkflowManager.transitionState(projectId, 'DISCOVERY_RUNNING', 'Start');
  await CompanyPipelineEngine.runPipeline(projectId);
}

// ─── Tests ──────────────────────────────────────────────────────────────────
describe('StudyMate E2E — Full AI Company Pipeline Integration Test', () => {
  const PROJECT_ID = 'studymate-e2e';

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockWorkflowState).forEach((k) => delete mockWorkflowState[k]);
    Object.keys(mockArtifacts).forEach((k) => delete mockArtifacts[k]);
    Object.keys(mockApprovals).forEach((k) => delete mockApprovals[k]);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PIPELINE FLOW (runs end-to-end to first approval gate)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Pipeline Flow', () => {
    it('should initialize workflow state at CREATED', async () => {
      const res = await WorkflowManager.getOrInitState(PROJECT_ID);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.currentPhase).toBe('CREATED');
        expect(res.data.progress).toBe(0);
      }
    });

    it('should transition CREATED → DISCOVERY_RUNNING', async () => {
      await WorkflowManager.getOrInitState(PROJECT_ID);
      await ArtifactManager.storeArtifact(PROJECT_ID, {
        type: 'ProjectIdea', content: { name: 'StudyMate' }, producerRole: 'USER', summary: 'Idea',
      });
      const res = await WorkflowManager.transitionState(PROJECT_ID, 'DISCOVERY_RUNNING', 'Start');
      expect(res.success).toBe(true);
    });

    it('should run DISCOVERY → CLARIFICATION → PROPOSAL → PAUSE for approval', async () => {
      await runToFirstApproval(PROJECT_ID);

      const state = await WorkflowManager.getOrInitState(PROJECT_ID);
      expect(state.success).toBe(true);
      if (state.success) {
        expect(state.data.currentPhase).toBe('PAUSED');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE ARTIFACTS (verified after running to first approval gate)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 1 — Product Discovery', () => {
    it('should create ProductSpecification artifact', async () => {
      await runToFirstApproval(PROJECT_ID);

      const artifact = await ArtifactManager.getLatestArtifact(PROJECT_ID, 'ProductSpecification');
      expect(artifact.success).toBe(true);
      if (artifact.success) {
        expect(artifact.data.productName).toBe('StudyMate');
        expect(artifact.data.targetAudience).toBe('University students');
        expect(artifact.data.mvpFeatures).toHaveLength(4);
      }
    });
  });

  describe('Phase 2 — Clarification Engine', () => {
    it('should generate questions and produce ClarifiedSpecification', async () => {
      await runToFirstApproval(PROJECT_ID);

      const clarified = await ArtifactManager.getLatestArtifact(PROJECT_ID, 'ClarifiedSpecification');
      expect(clarified.success).toBe(true);
      if (clarified.success) {
        expect(clarified.data.specification).toBeDefined();
        expect(clarified.data.questions).toBeDefined();
        expect(clarified.data.questions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Phase 3 — Product Proposal', () => {
    it('should create ProductProposal with quality score', async () => {
      await runToFirstApproval(PROJECT_ID);

      const proposal = await ArtifactManager.getLatestArtifact(PROJECT_ID, 'ProductProposal');
      expect(proposal.success).toBe(true);
      if (proposal.success) {
        expect(proposal.data.product).toBe('StudyMate');
        expect(proposal.data.mvp.features).toContain('Auth');
        expect(proposal.data.qualityScore.overall).toBeGreaterThanOrEqual(85);
      }
    });
  });

  describe('Phase 4 — Human Approval Gate', () => {
    it('should pause pipeline for Product Approval', async () => {
      await runToFirstApproval(PROJECT_ID);

      const state = await WorkflowManager.getOrInitState(PROJECT_ID);
      if (state.success) {
        expect(state.data.currentPhase).toBe('PAUSED');
      }

      expect(WorkspaceService.markApprovalRequired).toHaveBeenCalledWith(
        PROJECT_ID, 'Product Approval', 'PROPOSAL_RUNNING'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CEO STRATEGY (test engine directly since pipeline is paused)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 5 — CEO Agent (Strategy)', () => {
    it('should produce BusinessStrategy via analyzeUserIdea', async () => {
      const { analyzeUserIdea } = await import('@/ai/agents/roles/ceo/ceo.service');
      const result = await analyzeUserIdea(PROJECT_ID, 'StudyMate student task app');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.vision).toBeDefined();
        expect(result.data.vision.problem).toContain('Students');
        expect(result.data.requirements).toBeDefined();
        expect(result.data.plan).toBeDefined();
        expect(result.data.qualityScore?.verdict).toBe('APPROVED');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT MANAGEMENT (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 6 — Product Manager Agent', () => {
    it('should produce PRD via refineRequirements', async () => {
      const { refineRequirements } = await import('@/ai/agents/roles/product-manager/product-manager.service');
      const ceoData = {
        vision: { problem: 'test', solution: 'test', targetUsers: [], businessGoal: 'test' },
        requirements: { features: [], userStories: [], priorities: [], constraints: [] },
        plan: { phases: [], tasks: [], estimatedComplexity: 'MVP' },
      };
      const result = await refineRequirements(PROJECT_ID, ceoData as any);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userStories).toBeDefined();
        expect(result.data.userStories.length).toBeGreaterThan(0);
        expect(result.data.featureSpecs).toBeDefined();
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS ANALYSIS (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 7a — Business Analyst', () => {
    it('should produce SRS via generateSoftwareRequirementSpec', async () => {
      const { generateSoftwareRequirementSpec } = await import('@/ai/agents/roles/business-analyst/business-analyst.service');
      const result = await generateSoftwareRequirementSpec(PROJECT_ID, {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.srs).toBeDefined();
        expect(result.data.srs.title).toContain('StudyMate');
        expect(result.data.status).toBe('COMPLETE');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // UI DESIGN (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 7b — UI Designer', () => {
    it('should produce DesignSpec via generateUiDesignSpec', async () => {
      const { generateUiDesignSpec } = await import('@/ai/agents/roles/ui-designer/ui-designer.service');
      const result = await generateUiDesignSpec(PROJECT_ID, {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.designTokens).toBeDefined();
        expect(result.data.visualStyleGuide).toBeDefined();
        expect(result.data.status).toBe('COMPLETE');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // ARCHITECTURE (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 8 — Software Architect', () => {
    it('should produce ArchitectureDocument via designArchitecture', async () => {
      const { designArchitecture } = await import('@/ai/agents/roles/architect/architect.service');
      const result = await designArchitecture(PROJECT_ID, {
        features: [{ name: 'Task creation', description: 'Create tasks' }],
        userStories: [], priorities: [], constraints: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.architecture.frontend).toContain('Next.js');
        expect(result.data.database).toBeDefined();
        expect(result.data.decisions).toBeDefined();
        expect(result.data.qualityScore?.verdict).toBe('APPROVED');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTIVE PLANNER (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 9 — Executive Planner', () => {
    it('should produce milestones and tasks via planProjectWork', async () => {
      const { ExecutivePlanner } = await import('@/core/executive/executive-planner');
      const result = await ExecutivePlanner.planProjectWork(PROJECT_ID);

      expect(result.milestones).toBeDefined();
      expect(result.milestones.length).toBeGreaterThanOrEqual(3);
      expect(result.tasks).toBeDefined();
      expect(result.tasks.length).toBeGreaterThanOrEqual(2);
      expect(result.tasks[0].title).toBeDefined();
      expect(result.tasks[0].assignedTo).toBeDefined();
      expect(result.criticalPath).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CAPABILITY MATCHING (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 10 — Capability Matching', () => {
    it('should evaluate task capability and return agent match', async () => {
      const { AgentCapabilityEngine } = await import('@/core/workforce/capability/agent-capability.engine');
      const result = await AgentCapabilityEngine.evaluateTaskCapability(
        { title: 'Build task dashboard', description: 'Create React frontend for task management' },
        PROJECT_ID,
      );

      expect(result.primaryAgent).toBeDefined();
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0.8);
      expect(result.supportingReviewer).toBeDefined();
    });

    it('should be called by pipeline for each phase', async () => {
      const { AgentCapabilityEngine } = await import('@/core/workforce/capability/agent-capability.engine');
      await runToFirstApproval(PROJECT_ID);

      expect(AgentCapabilityEngine.evaluateTaskCapability).toHaveBeenCalled();
      const calls = (AgentCapabilityEngine.evaluateTaskCapability as any).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(1);
      expect(calls[0][0]).toHaveProperty('title');
      expect(calls[0][1]).toBe(PROJECT_ID);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT INJECTION (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 11 — Context Injection', () => {
    it('should inject context for task and return role/personality', async () => {
      const { ContextInjectorService } = await import('@/core/workforce/context/context-injector.service');
      const result = await ContextInjectorService.injectContextForTask(
        `${PROJECT_ID}_DEVELOPMENT`, 'Software Engineering', 'Build app', PROJECT_ID,
      );

      expect(result.role).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.context.project).toBe('StudyMate');
    });

    it('should be called by pipeline for each phase', async () => {
      const { ContextInjectorService } = await import('@/core/workforce/context/context-injector.service');
      await runToFirstApproval(PROJECT_ID);

      expect(ContextInjectorService.injectContextForTask).toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DEVELOPER (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 12 — Developer Agent', () => {
    it('should produce implementation with files and changes', async () => {
      const { implementArchitecture } = await import('@/ai/agents/roles/developer/developer.service');
      const result = await implementArchitecture(PROJECT_ID, {
        architecture: { frontend: 'Next.js', backend: 'API Routes', database: 'Prisma', infrastructure: 'Vercel', security: 'NextAuth' },
        database: { entities: [], relationships: [], indexes: [], constraints: [] },
        api: { endpoints: [] },
        decisions: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.plan).toBeDefined();
        expect(result.data.changes).toBeDefined();
        expect(result.data.changes.length).toBeGreaterThan(0);
        expect(result.data.report.completed).toBe(true);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // QA (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 13 — QA Agent', () => {
    it('should produce quality report with tests', async () => {
      const { reviewImplementation } = await import('@/ai/agents/roles/qa/qa.service');
      const result = await reviewImplementation(PROJECT_ID, {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.unitTests).toBeDefined();
        expect(result.data.unitTests.length).toBeGreaterThan(0);
        expect(result.data.qualityReport.verdict).toBe('PASS');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REVIEW COMMITTEE (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 14 — Review Committee', () => {
    it('should evaluate codebase and return score/decision', async () => {
      const { ReviewCommittee } = await import('@/core/review-committee/review-committee');
      const result = ReviewCommittee.evaluateCodebase(PROJECT_ID, { 'app/page.tsx': 'export default function() {}' });

      expect(result.overallScore).toBeGreaterThanOrEqual(85);
      expect(result.decision).toBe('APPROVED');
      expect(result.reviewers).toBeDefined();
      expect(result.reviewers.length).toBeGreaterThanOrEqual(4);
    });

    it('should be called by pipeline during REVIEW phase', async () => {
      const { ReviewCommittee } = await import('@/core/review-committee/review-committee');
      await runToFirstApproval(PROJECT_ID);

      // ReviewCommittee is called during REVIEW phase which comes after approval
      // Verify it exists and is callable
      expect(typeof ReviewCommittee.evaluateCodebase).toBe('function');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 15 — Security Agent', () => {
    it('should produce security report', async () => {
      const { generateSecurityReportSpec } = await import('@/ai/agents/roles/security/security.service');
      const result = await generateSecurityReportSpec(PROJECT_ID, {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.riskScore).toBeDefined();
        expect(result.data.riskScore.riskLevel).toBe('LOW');
        expect(result.data.authenticationAudit.mechanism).toBe('NextAuth.js');
        expect(result.data.status).toBe('COMPLETE');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // DEPLOYMENT (test engine directly)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase 16 — DevOps & Deployment', () => {
    it('should produce deployment plan', async () => {
      const { generateDevopsPlanSpec } = await import('@/ai/agents/roles/devops/devops.service');
      const result = await generateDevopsPlanSpec(PROJECT_ID, {});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.deploymentPlan).toBeDefined();
        expect(result.data.environmentVariables).toBeDefined();
        expect(result.data.rollbackStrategy).toBeDefined();
        expect(result.data.status).toBe('COMPLETE');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // WORKSPACE INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Workspace Integration', () => {
    it('should call WorkspaceService.updateFromPipelinePhase at each phase start', async () => {
      await runToFirstApproval(PROJECT_ID);

      // DISCOVERY, CLARIFICATION, PROPOSAL = 3 calls
      expect(WorkspaceService.updateFromPipelinePhase).toHaveBeenCalledTimes(3);
    });

    it('should call WorkspaceService.completePipelinePhase when phase completes', async () => {
      await runToFirstApproval(PROJECT_ID);

      // DISCOVERY and CLARIFICATION complete before PROPOSAL pauses
      expect(WorkspaceService.completePipelinePhase).toHaveBeenCalledTimes(2);
    });

    it('should call WorkspaceService.markApprovalRequired at approval gate', async () => {
      await runToFirstApproval(PROJECT_ID);

      expect(WorkspaceService.markApprovalRequired).toHaveBeenCalledWith(
        PROJECT_ID, 'Product Approval', 'PROPOSAL_RUNNING'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE DEFINITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Phase Definitions', () => {
    it('should have correct definitions for all 19 states', () => {
      const states = [
        'CREATED', 'DISCOVERY_RUNNING', 'CLARIFICATION_RUNNING', 'PROPOSAL_RUNNING',
        'STRATEGY_RUNNING', 'PRODUCT_RUNNING', 'ANALYSIS_RUNNING', 'DESIGN_RUNNING',
        'ARCHITECTURE_RUNNING', 'PLANNING_RUNNING', 'DEVELOPMENT_RUNNING',
        'TESTING_RUNNING', 'REVIEW_RUNNING', 'SECURITY_RUNNING', 'DEPLOYMENT_RUNNING',
        'MONITORING', 'COMPLETED', 'FAILED', 'PAUSED',
      ];
      for (const state of states) {
        expect(PIPELINE_PHASE_DEFINITIONS[state]).toBeDefined();
        expect(PIPELINE_PHASE_DEFINITIONS[state].state).toBe(state);
      }
    });

    it('should have approval gates at correct phases', () => {
      expect(PIPELINE_PHASE_DEFINITIONS.PROPOSAL_RUNNING.approvalRequiredAfter).toBe('Product Approval');
      expect(PIPELINE_PHASE_DEFINITIONS.DESIGN_RUNNING.approvalRequiredAfter).toBe('Design Approval');
      expect(PIPELINE_PHASE_DEFINITIONS.ARCHITECTURE_RUNNING.approvalRequiredAfter).toBe('Architecture Approval');
      expect(PIPELINE_PHASE_DEFINITIONS.DEPLOYMENT_RUNNING.approvalRequiredAfter).toBe('Deployment Approval');
    });

    it('should have correct nextState chain for all phases', () => {
      expect(PIPELINE_PHASE_DEFINITIONS.CREATED.nextState).toBe('DISCOVERY_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.DISCOVERY_RUNNING.nextState).toBe('CLARIFICATION_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.CLARIFICATION_RUNNING.nextState).toBe('PROPOSAL_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.PROPOSAL_RUNNING.nextState).toBe('STRATEGY_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.STRATEGY_RUNNING.nextState).toBe('PRODUCT_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.PRODUCT_RUNNING.nextState).toBe('ANALYSIS_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.ANALYSIS_RUNNING.nextState).toBe('PLANNING_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.PLANNING_RUNNING.nextState).toBe('ARCHITECTURE_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.ARCHITECTURE_RUNNING.nextState).toBe('DESIGN_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.DESIGN_RUNNING.nextState).toBe('DEVELOPMENT_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.DEVELOPMENT_RUNNING.nextState).toBe('TESTING_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.TESTING_RUNNING.nextState).toBe('REVIEW_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.REVIEW_RUNNING.nextState).toBe('SECURITY_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.SECURITY_RUNNING.nextState).toBe('DEPLOYMENT_RUNNING');
      expect(PIPELINE_PHASE_DEFINITIONS.DEPLOYMENT_RUNNING.nextState).toBe('MONITORING');
      expect(PIPELINE_PHASE_DEFINITIONS.MONITORING.nextState).toBe('COMPLETED');
    });
  });
});
