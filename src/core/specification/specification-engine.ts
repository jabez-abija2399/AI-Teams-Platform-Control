import { SoftwareRequirementsSpecification } from './types';
import { IdeaAnalyzer } from './idea-analyzer';
import { RequirementsGenerator } from './requirements-generator';
import { ClarificationEngine } from '@/core/discovery/clarification.engine';
import { ScopeAnalyzer } from './scope-analyzer';
import { RiskEngine } from './risk-engine';
import { ProductDiscoveryAgent } from '@/ai/agents/roles/product-discovery.agent';

export class SpecificationEngine {
  /**
   * Generates a complete Software Requirements Specification (SRS) from a user idea prompt using Product Discovery Agent
   */
  public static async generateSpecification(
    projectId: string,
    rawIdea: string
  ): Promise<SoftwareRequirementsSpecification> {
    const discoveryAgent = new ProductDiscoveryAgent();
    const productSpec = await discoveryAgent.discoverProductSpecification(rawIdea);

    const analysis = IdeaAnalyzer.analyzeIdea(rawIdea);
    const funcReqs = RequirementsGenerator.generateFunctionalRequirements(analysis.detectedFeatures);
    const userStories = RequirementsGenerator.generateUserStories(analysis.detectedFeatures);
    const dbReqs = RequirementsGenerator.generateDatabaseSchema();
    const apiReqs = RequirementsGenerator.generateApiEndpoints();
    const openQuestions = ClarificationEngine.generateClarificationQuestions(analysis.missingContext);
    const risks = RiskEngine.analyzeRisks(analysis.coreDomain, analysis.detectedFeatures);
    const scope = ScopeAnalyzer.calculateScope(funcReqs.length, apiReqs.length);

    return {
      id: `SRS-${Date.now()}`,
      projectId,
      rawIdea,
      executiveSummary: `Production Specification for ${analysis.coreDomain}. Focuses on delivering scalable software capabilities.`,
      problemStatement: `Users lack an integrated, automated solution for ${rawIdea.slice(0, 60)}...`,
      proposedSolution: `Deploy a modern ${analysis.coreDomain} featuring automated pipeline orchestration and real-time responsiveness.`,
      projectGoals: [
        'Deliver a production-ready application with zero technical debt',
        'Achieve >95% unit & integration test coverage',
        'Ensure full responsive design across desktop and mobile browsers',
      ],
      targetUsers: analysis.targetAudience,
      functionalRequirements: funcReqs,
      nonFunctionalRequirements: {
        performance: ['P99 latency under 200ms', 'Lighthouse score > 90'],
        security: ['TLS 1.3 encryption', 'OWASP Top 10 compliance', 'Zod payload validation'],
        accessibility: ['WCAG 2.1 AA compliant', 'Keyboard navigation enabled'],
        responsiveDesign: ['Mobile-first layout grid', 'Dark mode glassmorphism theme'],
        analytics: ['Client interaction telemetry', 'Error tracking via Sentry'],
        deployment: ['Containerized Docker sandbox', 'Automated CI/CD deployment'],
      },
      userStories,
      databaseRequirements: dbReqs,
      apiRequirements: apiReqs,
      authenticationStrategy: 'JWT AuthJS Session Management with HttpOnly Cookies',
      authorizationStrategy: 'Role-Based Access Control (RBAC)',
      futureEnhancements: ['AI-driven workflow predictions', 'Multi-region database replication'],
      knownRisks: risks,
      openQuestions,
      estimatedComplexity: scope.complexity,
      estimatedTimelineDays: scope.timelineDays,
      estimatedCostUSD: scope.estimatedCostUSD,
      recommendedWorkflow: ['SPECIFICATION', 'ARCHITECTURE', 'DATABASE', 'BACKEND', 'FRONTEND', 'QA', 'DEPLOYMENT'],
      isApproved: false,
      createdAt: new Date().toISOString(),
    };
  }

  public static approveSpecification(spec: SoftwareRequirementsSpecification): SoftwareRequirementsSpecification {
    return {
      ...spec,
      isApproved: true,
      approvedAt: new Date().toISOString(),
    };
  }
}
