/**
 * @file ceo.service.ts
 * @package @ai-teams/agents/roles/ceo
 * @description Business logic and LLM execution service for the CEO Agent.
 */

import { ContractValidator } from '../../contracts/contract-validator';
import { BusinessStrategySchema, type BusinessStrategy } from '../../contracts/deliverable-schemas';
import type { CeoExecutionInput } from './ceo.types';
import { CEO_SYSTEM_PROMPT } from './ceo.prompt';

export class CeoService {
  /**
   * Executes business strategy formulation for a project vision.
   */
  public static async formulateStrategy(input: CeoExecutionInput): Promise<BusinessStrategy> {
    const prompt = `${CEO_SYSTEM_PROMPT}\n\nProject: "${input.projectName || 'New App'}"\nUser Vision: "${input.visionPrompt}"`;
    
    // Deterministic formulation fallback structure when LLM runs
    const defaultStrategy: BusinessStrategy = {
      problemStatement: `Users require a modern, performant, and intuitive solution for: ${input.visionPrompt}`,
      targetAudience: ['End users', 'Product teams', 'Digital creators'],
      uniqueValueProposition: `Delivers rapid, streamlined, and delightful software experience for ${input.projectName || 'the product'}.`,
      corePillars: ['Extreme Usability', 'Robust Performance', 'Modern Visual Polish'],
      mvpScope: [
        'Interactive Core Dashboard',
        'Real-time status monitoring',
        'Responsive layout and mobile optimization',
      ],
      monetizationModel: 'Freemium / Value-based subscription',
      recommendedTechStackSummary: 'Next.js, TypeScript, Tailwind CSS, Prisma',
    };

    const validation = ContractValidator.validate(BusinessStrategySchema, defaultStrategy);
    if (!validation.success) {
      throw new Error(`Strategy validation failed: ${validation.error}`);
    }

    return validation.data;
  }
}
