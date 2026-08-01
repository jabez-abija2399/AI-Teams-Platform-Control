import { BaseAgent } from '../core/agent.base';
import type { AgentExecutionResult } from '../core/agent.types';

export interface MvpFeature {
  name: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'single_choice' | 'multi_choice' | 'text';
  options: string[];
  required: boolean;
}

export interface ProductSpecification {
  productName: string;
  vision: string;
  problemStatement: string;
  targetAudience: string;
  platform: string;
  complexity: 'MVP' | 'MODERATE' | 'COMPLEX';
  mvpFeatures: MvpFeature[];
  futureFeatures: string[];
  questions: ClarificationQuestion[] | string[];
  clarificationRequired?: boolean;
  approvalRequired?: boolean;
}

export class ProductDiscoveryAgent extends BaseAgent {
  constructor(name = 'Product Discovery Agent') {
    super('PRODUCT_DISCOVERY', name);
  }

  /**
   * Analyzes raw user idea and transforms it into a structured ProductSpecification
   */
  public async discoverProductSpecification(rawIdea: string): Promise<ProductSpecification> {
    const cleanIdea = rawIdea.trim();
    const lower = cleanIdea.toLowerCase();

    // Deriving product name
    let productName = 'AppCraft';
    if (lower.includes('todo')) productName = 'TodoFlow';
    else if (lower.includes('e-commerce') || lower.includes('store') || lower.includes('shop')) productName = 'StoreCraft';
    else if (lower.includes('dashboard') || lower.includes('saas')) productName = 'DashPulse';
    else {
      const words = cleanIdea.split(' ').filter(w => w.length > 2);
      const mainWord = words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : 'SmartApp';
      productName = `${mainWord}Flow`;
    }

    // Target audience & platform
    const targetAudience = lower.includes('team') || lower.includes('business')
      ? 'Small teams and business professionals'
      : 'Students, creators, and individuals';

    const platform = lower.includes('mobile') ? 'Mobile & Web application' : 'Web application';

    // MVP Features breakdown
    const mvpFeatures: MvpFeature[] = [];

    if (lower.includes('todo') || lower.includes('task')) {
      mvpFeatures.push(
        { name: 'Create tasks', priority: 'HIGH' },
        { name: 'Complete tasks', priority: 'HIGH' },
        { name: 'Task categories & tags', priority: 'MEDIUM' },
        { name: 'Delete tasks', priority: 'HIGH' }
      );
    } else if (lower.includes('store') || lower.includes('shop') || lower.includes('e-commerce')) {
      mvpFeatures.push(
        { name: 'Product catalog browsing', priority: 'HIGH' },
        { name: 'Shopping cart & Checkout', priority: 'HIGH' },
        { name: 'Stripe Payment Processing', priority: 'HIGH' },
        { name: 'User order history', priority: 'MEDIUM' }
      );
    } else {
      mvpFeatures.push(
        { name: 'User Authentication', priority: 'HIGH' },
        { name: 'Core Dashboard View', priority: 'HIGH' },
        { name: 'Data Creation & Management', priority: 'HIGH' },
        { name: 'Settings & Profile Management', priority: 'MEDIUM' }
      );
    }

    // Future features & clarification questions
    const futureFeatures = [
      'Team collaboration & sharing',
      'AI productivity assistant',
      'Advanced analytics & reporting export',
    ];

    const questions: string[] = [];
    if (cleanIdea.length < 15) {
      questions.push('Would you like email/password authentication or social logins?');
    }

    const vision = lower.includes('todo') || lower.includes('task')
      ? 'A simple task management application helping users organize daily activities'
      : `A streamlined ${platform.toLowerCase()} helping users ${cleanIdea.toLowerCase()}`;

    return {
      productName,
      vision,
      problemStatement: `Users need an intuitive, reliable tool to solve: ${cleanIdea}`,
      targetAudience,
      platform,
      complexity: 'MVP',
      mvpFeatures,
      futureFeatures,
      questions,
    };
  }

  override async execute(
    task: string,
    context?: Record<string, unknown>,
  ): Promise<AgentExecutionResult> {
    const spec = await this.discoverProductSpecification(task);

    return {
      success: true,
      output: JSON.stringify(spec, null, 2),
    };
  }
}
