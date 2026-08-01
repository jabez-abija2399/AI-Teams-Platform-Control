import { ArchitectureScoreService, type ArchitectureQualityScores } from './architecture-score.service';

export interface ArchitectureDecision {
  decision: string;
  reason: string;
  impact: string;
}

export interface ArchitectureProposal {
  id: string;
  projectId: string;
  frontend: {
    framework: string;
    libraries: string[];
  };
  backend: {
    framework: string;
    apiStyle: string;
  };
  database: {
    technology: string;
    orm: string;
  };
  authentication: {
    strategy: string;
  };
  deployment: {
    provider: string;
  };
  architecturePattern: string;
  decisions: ArchitectureDecision[];
  tradeoffs: string[];
  qualityScores: ArchitectureQualityScores;
  risks: string[];
}

export class ArchitectureProposalEngine {
  /**
   * Transforms raw architect output or specification into a user-friendly ArchitectureProposal
   */
  public static generateProposal(architectOutput: unknown, projectId = 'arch_draft'): ArchitectureProposal {
    const raw = typeof architectOutput === 'object' && architectOutput !== null ? (architectOutput as Record<string, unknown>) : {};

    const frontend = {
      framework: (raw.frontendFramework as string) || 'Next.js 14 (App Router, React 18)',
      libraries: (raw.frontendLibraries as string[]) || ['TailwindCSS', 'Zustand', 'Lucide React', 'Shadcn UI'],
    };

    const backend = {
      framework: (raw.backendFramework as string) || 'Next.js API Routes / Node.js TypeScript Service',
      apiStyle: (raw.apiStyle as string) || 'REST / JSON API with Zod validation',
    };

    const database = {
      technology: (raw.databaseTech as string) || 'PostgreSQL 16',
      orm: (raw.orm as string) || 'Prisma ORM (Strict TypeScript Types)',
    };

    const authentication = {
      strategy: (raw.authStrategy as string) || 'NextAuth.js / Auth.js with JWT sessions',
    };

    const deployment = {
      provider: (raw.deploymentProvider as string) || 'Docker Containers / Vercel Edge Serverless',
    };

    const architecturePattern = (raw.architecturePattern as string) || 'Modular Monolith with Domain Services & DAG Task Engine';

    const decisions: ArchitectureDecision[] = (raw.decisions as ArchitectureDecision[]) || [
      {
        decision: 'Use Next.js 14 App Router for unified SSR and API routes',
        reason: 'Reduces deployment friction and provides native fullstack React capabilities',
        impact: 'High performance and seamless integration between UI and backend APIs',
      },
      {
        decision: 'Use Prisma ORM with PostgreSQL',
        reason: 'Type-safe database queries and automated schema migrations',
        impact: 'Zero runtime schema mismatches and reliable data integrity',
      },
      {
        decision: 'Event-driven observability via Visibility Engine',
        reason: 'Real-time monitoring of multi-agent execution steps',
        impact: 'Full transparency into autonomous agent task completion',
      },
    ];

    const tradeoffs = (raw.tradeoffs as string[]) || [
      'Increased initial setup complexity for DAG orchestrator',
      'Memory consumption for concurrent agent workers',
    ];

    const risks = (raw.risks as string[]) || [
      'High API rate limits during peak agent activity',
      'Database migration locks on heavy schema updates',
    ];

    const proposalPartial: Omit<ArchitectureProposal, 'qualityScores'> = {
      id: `arch_${Date.now()}`,
      projectId,
      frontend,
      backend,
      database,
      authentication,
      deployment,
      architecturePattern,
      decisions,
      tradeoffs,
      risks,
    };

    const qualityScores = ArchitectureScoreService.calculateScore(proposalPartial);

    return {
      ...proposalPartial,
      qualityScores,
    };
  }
}
