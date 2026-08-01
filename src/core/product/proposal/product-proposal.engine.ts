import type { ProductSpecification, MvpFeature } from '@/ai/agents/roles/product-discovery.agent';

export interface ProposalFeature {
  id: string;
  name: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface AssignedAgent {
  role: string;
  title: string;
  responsibilities: string;
}

export interface ProductProposal {
  id: string;
  productName: string;
  tagline: string;
  vision: string;
  problem: string;
  targetAudience: string;
  platform: string;
  complexity: string;
  mvpFeatures: ProposalFeature[];
  futureFeatures: string[];
  aiTeam: AssignedAgent[];
  estimatedTimeline: string;
  risks: string[];
}

export class ProductProposalEngine {
  /**
   * Converts a ProductSpecification into a user-friendly, structured ProductProposal
   */
  public static generateProposal(spec: ProductSpecification, projectId = 'proposal_draft'): ProductProposal {
    const rawFeatures = (spec.mvpFeatures as MvpFeature[]) ?? [];

    const mvpFeatures: ProposalFeature[] = rawFeatures.map((feat, idx) => ({
      id: `feat_${idx + 1}`,
      name: typeof feat === 'string' ? feat : feat.name,
      description: `Core functionality for ${typeof feat === 'string' ? feat : feat.name}`,
      priority: typeof feat === 'object' && feat.priority ? feat.priority : 'HIGH',
    }));

    const aiTeam: AssignedAgent[] = [
      {
        role: 'CEO',
        title: 'Chief Executive Officer AI',
        responsibilities: 'Overall product strategy, goals, and executive oversight',
      },
      {
        role: 'PRODUCT_MANAGER',
        title: 'Product Manager AI',
        responsibilities: 'Requirement breakdown, user stories, and feature prioritization',
      },
      {
        role: 'ARCHITECT',
        title: 'Software Architect AI',
        responsibilities: 'System architecture, API design, and schema layout',
      },
      {
        role: 'DEVELOPER',
        title: 'Lead Fullstack Developer AI',
        responsibilities: 'Frontend and backend implementation and integration',
      },
      {
        role: 'QA',
        title: 'QA Automation Engineer AI',
        responsibilities: 'Automated testing, quality validation, and regression checks',
      },
    ];

    const tagline = `Empowering ${spec.targetAudience.toLowerCase()} with high-performance ${spec.platform.toLowerCase()} solutions`;

    const estimatedTimeline =
      spec.complexity === 'MVP'
        ? '1 - 2 weeks'
        : spec.complexity === 'MODERATE'
        ? '2 - 4 weeks'
        : '4 - 8 weeks';

    const risks = [
      'Scope expansion during rapid development phase',
      'Integration compatibility with external services',
    ];

    return {
      id: `prop_${Date.now()}`,
      productName: spec.productName || 'SmartAppFlow',
      tagline,
      vision: spec.vision,
      problem: spec.problemStatement,
      targetAudience: spec.targetAudience,
      platform: spec.platform,
      complexity: spec.complexity || 'MVP',
      mvpFeatures,
      futureFeatures: spec.futureFeatures || [],
      aiTeam,
      estimatedTimeline,
      risks,
    };
  }
}
