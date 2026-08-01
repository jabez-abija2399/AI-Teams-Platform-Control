import type { ImpactAnalysisResult } from './types';
import { CompanyMemoryService } from './company-memory.service';
import { DecisionIntelligenceEngine } from './decision-intelligence.engine';

export class ChangeImpactAnalyzer {
  /**
   * Analyzes potential impact of changing a requirement, decision, or technology stack choice
   */
  public static async analyzeImpact(projectId: string, changeDescription: string): Promise<ImpactAnalysisResult> {
    const memory = await CompanyMemoryService.getMemory(projectId);
    const decisions = await DecisionIntelligenceEngine.getDecisions(projectId);

    const text = changeDescription.toLowerCase();
    const affectedComponents: string[] = [];
    const affectedAgents: string[] = [];
    const affectedTasks: string[] = [];
    const recommendedActions: string[] = [];

    if (text.includes('database') || text.includes('schema') || text.includes('postgres') || text.includes('mongo')) {
      affectedComponents.push('Prisma Schema Data Models', 'Database Migration Scripts', 'ORM Service Layer');
      affectedAgents.push('DATABASE', 'DEVELOPER', 'QA');
      affectedTasks.push('Task #201: Schema Migration', 'Task #202: Entity Index Optimization');
      recommendedActions.push(
        'Regenerate Prisma Client and run database migration push',
        'Update backend repository services to match modified schema'
      );
    }

    if (text.includes('auth') || text.includes('jwt') || text.includes('security')) {
      affectedComponents.push('Authentication Middleware', 'Session Helper Utilities', 'Protected API Routes');
      affectedAgents.push('SECURITY', 'DEVELOPER', 'FRONTEND');
      affectedTasks.push('Task #301: Auth Route Validation', 'Task #302: JWT Token Strategy');
      recommendedActions.push(
        'Audit NextAuth JWT callbacks',
        'Run security regression suite'
      );
    }

    if (text.includes('frontend') || text.includes('ui') || text.includes('design') || text.includes('theme')) {
      affectedComponents.push('Mission Control Dashboard UI', 'Glassmorphism Design System', 'Client Components');
      affectedAgents.push('FRONTEND', 'QA');
      affectedTasks.push('Task #401: UI Component Assembly', 'Task #402: Responsive Design Check');
      recommendedActions.push(
        'Verify CSS token palette and dark mode contrast scores',
        'Execute frontend component unit tests'
      );
    }

    if (affectedComponents.length === 0) {
      affectedComponents.push('General System Configuration');
      affectedAgents.push('CEO', 'PRODUCT_MANAGER', 'ARCHITECT');
      affectedTasks.push('Task #101: Requirements Specification Review');
      recommendedActions.push('Re-evaluate Product Specification and notify AI Team lead');
    }

    return {
      changeDescription,
      affectedComponents,
      affectedAgents: Array.from(new Set(affectedAgents)),
      affectedTasks: Array.from(new Set(affectedTasks)),
      recommendedActions: Array.from(new Set(recommendedActions)),
    };
  }
}
