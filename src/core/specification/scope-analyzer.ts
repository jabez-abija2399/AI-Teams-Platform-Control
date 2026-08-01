import { SoftwareRequirementsSpecification } from './types';

export class ScopeAnalyzer {
  public static calculateScope(
    featureCount: number,
    apiCount: number
  ): {
    complexity: SoftwareRequirementsSpecification['estimatedComplexity'];
    timelineDays: number;
    estimatedCostUSD: number;
  } {
    const score = featureCount * 2 + apiCount;

    if (score <= 5) {
      return { complexity: 'SIMPLE', timelineDays: 3, estimatedCostUSD: 150 };
    } else if (score <= 10) {
      return { complexity: 'MODERATE', timelineDays: 7, estimatedCostUSD: 450 };
    } else if (score <= 20) {
      return { complexity: 'COMPLEX', timelineDays: 14, estimatedCostUSD: 1200 };
    } else {
      return { complexity: 'ENTERPRISE', timelineDays: 30, estimatedCostUSD: 3500 };
    }
  }
}
