import type { ProductSpecification, ClarificationQuestion, MvpFeature } from '@/ai/agents/roles/product-discovery.agent';

export class ClarificationEngine {
  /**
   * Analyzes ProductSpecification to generate 3-5 intelligent clarification questions
   */
  public static generateQuestions(specification: ProductSpecification): ClarificationQuestion[] {
    const text = `${specification.productName} ${specification.vision} ${specification.problemStatement}`.toLowerCase();

    // 1. Photography / Studio / Portfolio / Creative Showcase
    if (text.includes('photo') || text.includes('studio') || text.includes('slash') || text.includes('gallery') || text.includes('portfolio')) {
      return [
        {
          id: 'primary_goal',
          question: 'What is the primary goal for Slash Photo Studio?',
          type: 'single_choice',
          options: ['Showcase portfolio & attract high-end clients', 'Direct session booking & package inquiries', 'Complete studio presentation with pricing and about'],
          required: true,
        },
        {
          id: 'visual_style',
          question: 'Which visual aesthetic fits the studio best?',
          type: 'single_choice',
          options: ['Modern Dark & Cinematic', 'Clean Editorial & Minimalist', 'Vibrant & High-Contrast Fashion'],
          required: true,
        },
        {
          id: 'key_features',
          question: 'Which key sections should be highlighted?',
          type: 'multi_choice',
          options: ['Portfolio Gallery Categories', 'Session Pricing & Packages', 'Interactive Booking Form', 'Client Testimonials & Location'],
          required: false,
        },
        {
          id: 'target_platform',
          question: 'Which platform should we build for?',
          type: 'single_choice',
          options: ['Responsive Web (Desktop & Mobile)', 'Mobile-First Web Experience', 'Static Portfolio Site'],
          required: true,
        },
      ];
    }

    // 2. E-Commerce / Store
    if (text.includes('store') || text.includes('shop') || text.includes('e-commerce') || text.includes('product')) {
      return [
        {
          id: 'target_audience',
          question: 'Who are your primary customers?',
          type: 'single_choice',
          options: ['Direct Consumers (B2C)', 'Business Clients (B2B)', 'Niche Community Members'],
          required: true,
        },
        {
          id: 'experience_type',
          question: 'What shopping experience do you envision?',
          type: 'single_choice',
          options: ['Curated Boutique Catalog', 'High-Volume Multi-Category Store', 'Single-Product Showcase'],
          required: true,
        },
        {
          id: 'key_features',
          question: 'Which capabilities are essential for MVP?',
          type: 'multi_choice',
          options: ['Instant Checkout & Cart', 'Product Filtering & Search', 'Customer Reviews & Ratings', 'Order Tracking'],
          required: false,
        },
        {
          id: 'target_platform',
          question: 'Target delivery platform:',
          type: 'single_choice',
          options: ['Responsive Web application', 'Mobile-Optimized Web App', 'Full-Stack Portal'],
          required: true,
        },
      ];
    }

    // 3. Default Business / Application questions
    return [
      {
        id: 'target_audience',
        question: 'Who will use this application?',
        type: 'single_choice',
        options: ['General Clients & Visitors', 'Small Business Teams', 'Individual Consumers'],
        required: true,
      },
      {
        id: 'experience_type',
        question: 'What user experience is desired?',
        type: 'single_choice',
        options: ['High-Impact Showcase & Inquiry', 'Interactive Web Application', 'Streamlined Portal'],
        required: true,
      },
      {
        id: 'key_features',
        question: 'Which core features are highest priority?',
        type: 'multi_choice',
        options: ['Hero Showcase & Highlights', 'Service / Feature Breakdown', 'Direct Action & Inquiry Form', 'Social Proof & Testimonials'],
        required: false,
      },
      {
        id: 'target_platform',
        question: 'Target delivery format:',
        type: 'single_choice',
        options: ['Responsive Web application', 'Mobile-Optimized Web App', 'Static Web Package'],
        required: true,
      },
    ];
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
