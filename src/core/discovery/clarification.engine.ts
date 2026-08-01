import type { ProductSpecification, ClarificationQuestion, MvpFeature } from '@/ai/agents/roles/product-discovery.agent';

export class ClarificationEngine {
  /**
   * Analyzes ProductSpecification to generate 3-5 intelligent clarification questions
   */
  public static generateQuestions(specification: ProductSpecification): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [
      {
        id: 'target_audience',
        question: 'Who will use this application?',
        type: 'single_choice',
        options: ['Personal productivity', 'Small team', 'Company employees'],
        required: true,
      },
      {
        id: 'experience_type',
        question: 'What type of experience do you want?',
        type: 'single_choice',
        options: ['Simple checklist', 'Advanced productivity tool', 'Team collaboration'],
        required: true,
      },
      {
        id: 'key_features',
        question: 'Which features are important?',
        type: 'multi_choice',
        options: ['Task categories', 'Due dates', 'Team sharing', 'Notifications'],
        required: false,
      },
      {
        id: 'target_platform',
        question: 'Which platform should we build?',
        type: 'single_choice',
        options: ['Web application', 'Mobile application', 'Desktop application'],
        required: true,
      },
    ];

    return questions;
  }

  /**
   * Generates clarification questions based on missing context (from SpecificationEngine)
   */
  public static generateClarificationQuestions(missingContext: string[]): string[] {
    const questions: string[] = [];

    if (missingContext.some((m) => m.includes('Authentication'))) {
      questions.push('Should the application support OAuth (Google/GitHub) or standard Email/Password authentication?');
    }

    questions.push(
      'What are the target SLA performance thresholds (e.g., <200ms latency)?',
      'Are there specific third-party integrations (Stripe, Twilio, OpenAI) required for Phase 1?'
    );

    return questions;
  }

  /**
   * Applies user answers to update and refine the ProductSpecification
   */
  public static applyAnswers(
    specification: ProductSpecification,
    answers: Record<string, string | string[]>
  ): ProductSpecification {
    const updated: ProductSpecification = {
      ...specification,
      clarificationRequired: false,
      approvalRequired: true,
    };

    if (answers.target_audience) {
      const val = Array.isArray(answers.target_audience) ? answers.target_audience.join(', ') : answers.target_audience;
      updated.targetAudience = val;
    }

    if (answers.target_platform) {
      const val = Array.isArray(answers.target_platform) ? answers.target_platform[0] : answers.target_platform;
      if (val) updated.platform = val;
    }

    if (answers.key_features) {
      const featureList = Array.isArray(answers.key_features) ? answers.key_features : [answers.key_features];
      const existingNames = new Set((specification.mvpFeatures as MvpFeature[]).map((f) => f.name.toLowerCase()));

      const newMvpFeatures = [...(specification.mvpFeatures as MvpFeature[])];
      featureList.forEach((feat) => {
        if (!existingNames.has(feat.toLowerCase())) {
          newMvpFeatures.push({ name: feat, priority: 'HIGH' });
        }
      });

      updated.mvpFeatures = newMvpFeatures;
    }

    return updated;
  }
}
