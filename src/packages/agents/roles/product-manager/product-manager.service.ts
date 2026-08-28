/**
 * @file product-manager.service.ts
 * @package @ai-teams/agents/roles/product-manager
 * @description Business logic and PRD generator service for the Product Manager Agent.
 */

import { ContractValidator } from '../../contracts/contract-validator';
import { ProductRequirementsDocSchema, type ProductRequirementsDoc } from '../../contracts/deliverable-schemas';
import type { ProductManagerExecutionInput } from './product-manager.types';

export class ProductManagerService {
  /**
   * Generates a complete Product Requirements Document (PRD).
   */
  public static async generatePrd(input: ProductManagerExecutionInput): Promise<ProductRequirementsDoc> {
    const defaultPrd: ProductRequirementsDoc = {
      productName: input.projectName || 'AI Software Project',
      executiveSummary: `Comprehensive product requirements for ${input.projectName || 'the app'} based on user vision: ${input.visionPrompt}`,
      targetUserPersonas: [
        {
          role: 'Primary User / Operator',
          goals: ['Complete tasks quickly', 'Experience zero friction', 'Gain immediate insights'],
          painPoints: ['Complex onboarding', 'Cluttered interfaces', 'Slow load times'],
        },
      ],
      featureEpics: [
        {
          epicId: 'EPIC-01',
          title: 'Core Application Experience',
          priority: 'CRITICAL',
          userStories: [
            {
              id: 'US-01',
              asA: 'User',
              iWantTo: `navigate and interact with ${input.projectName || 'the platform'}`,
              soThat: 'I can achieve my primary objective seamlessly',
              acceptanceCriteria: [
                'Responsive UI loads in under 1 second',
                'All interactive states have clear visual feedback',
                'Input forms validate client-side with clean error messages',
              ],
            },
          ],
        },
      ],
      outOfScope: ['Complex multi-tenant enterprise billing in MVP', 'Legacy browser support (IE11)'],
    };

    const validation = ContractValidator.validate(ProductRequirementsDocSchema, defaultPrd);
    if (!validation.success) {
      throw new Error(`PRD validation failed: ${validation.error}`);
    }

    return validation.data;
  }
}
