import { BaseAgent } from '../core/agent.base';
import type { AgentExecutionResult } from '../core/agent.types';
import { aiCall } from '../core/ai-call';
import { envModels } from '../core/model-routes';
import type { AgentModelConfig } from './ceo/ceo.config';
import { z } from 'zod';

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

const productSpecSchema = z.object({
  productName: z.string().min(1),
  vision: z.string().min(1),
  problemStatement: z.string().min(1),
  targetAudience: z.string().min(1),
  platform: z.string().min(1),
  complexity: z.enum(['MVP', 'MODERATE', 'COMPLEX']).default('MVP'),
  mvpFeatures: z
    .array(
      z.object({
        name: z.string(),
        priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
      }),
    )
    .min(1)
    .max(6),
  futureFeatures: z.array(z.string()).max(3).default([]),
  questions: z.array(z.string()).max(3).default([]),
});

const DISCOVERY_SYSTEM_PROMPT = `You are Product Discovery for an AI software company.

Return ONLY valid JSON:
productName, vision, problemStatement, targetAudience, platform,
complexity (MVP|MODERATE|COMPLEX), mvpFeatures[{name,priority}], futureFeatures[], questions[].

Rules:
- Match the user's requested scope EXACTLY. Do not expand a small idea into a big product.
- If the user asks for a simple login/signup page, keep MVP to auth screens only (login, signup, protected page). Do NOT add tasks, invoices, analytics, collaboration, or unrelated features.
- Prefer complexity MVP for small requests.
- Max 4 mvpFeatures for simple ideas. Max 2 futureFeatures.
- Use plain language. No markdown.`;

const discoveryConfig: AgentModelConfig = {
  models: envModels('PRODUCT_DISCOVERY'),
  temperature: 0.2,
  maxTokens: 1200,
};

function isAuthIdea(idea: string): boolean {
  const lower = idea.toLowerCase();
  return (
    lower.includes('login') ||
    lower.includes('log in') ||
    lower.includes('signin') ||
    lower.includes('sign in') ||
    lower.includes('signup') ||
    lower.includes('sign up') ||
    lower.includes('auth')
  );
}

export class ProductDiscoveryAgent extends BaseAgent {
  constructor(name = 'Product Discovery Agent') {
    super('PRODUCT_DISCOVERY', name);
  }

  public async discoverProductSpecification(rawIdea: string): Promise<ProductSpecification> {
    const cleanIdea = rawIdea.trim();
    try {
      const raw = await aiCall<unknown>(
        `User idea (stay within this scope only):\n${cleanIdea}\n\nProduce the product discovery JSON now.`,
        DISCOVERY_SYSTEM_PROMPT,
        'PRODUCT_DISCOVERY',
        discoveryConfig,
      );
      const parsed = productSpecSchema.parse(raw);
      return this.sanitizeSpec(parsed, cleanIdea);
    } catch (aiErr) {
      console.warn('[ProductDiscoveryAgent] AI discovery fallback:', aiErr);
      return this.heuristicSpecification(cleanIdea);
    }
  }

  private sanitizeSpec(
    spec: z.infer<typeof productSpecSchema>,
    idea: string,
  ): ProductSpecification {
    let mvpFeatures = spec.mvpFeatures;
    let futureFeatures = spec.futureFeatures;

    if (isAuthIdea(idea)) {
      mvpFeatures = mvpFeatures.filter((f) => {
        const n = f.name.toLowerCase();
        return !(
          n.includes('task') ||
          n.includes('todo') ||
          n.includes('invoice') ||
          n.includes('booking') ||
          n.includes('analytics') ||
          n.includes('collaborat')
        );
      });
      if (mvpFeatures.length === 0) {
        mvpFeatures = [
          { name: 'Email/password login', priority: 'HIGH' },
          { name: 'Sign up page', priority: 'HIGH' },
          { name: 'Protected page after login', priority: 'HIGH' },
        ];
      }
      futureFeatures = futureFeatures
        .filter((f) => {
          const n = f.toLowerCase();
          return !n.includes('analytics') && !n.includes('ai productivity') && !n.includes('collaborat');
        })
        .slice(0, 2);
      if (futureFeatures.length === 0) {
        futureFeatures = ['Forgot password', 'Optional Google login'];
      }
    }

    return {
      ...spec,
      complexity: isAuthIdea(idea) ? 'MVP' : spec.complexity,
      mvpFeatures: mvpFeatures.slice(0, isAuthIdea(idea) ? 4 : 6),
      futureFeatures: futureFeatures.slice(0, 3),
      clarificationRequired: spec.questions.length > 0,
      approvalRequired: true,
    };
  }

  private heuristicSpecification(cleanIdea: string): ProductSpecification {
    const lower = cleanIdea.toLowerCase();

    if (isAuthIdea(cleanIdea)) {
      return {
        productName: 'Simple Login',
        vision: 'A clean web login and signup experience for users.',
        problemStatement: `Users need a simple way to sign up and log in: ${cleanIdea}`,
        targetAudience: 'End users who need an account to access the app',
        platform: 'Web application',
        complexity: 'MVP',
        mvpFeatures: [
          { name: 'Email/password login', priority: 'HIGH' },
          { name: 'Sign up page', priority: 'HIGH' },
          { name: 'Protected page after login', priority: 'HIGH' },
        ],
        futureFeatures: ['Forgot password', 'Optional Google login'],
        questions: [],
        clarificationRequired: false,
        approvalRequired: true,
      };
    }

    let productName = 'Web Application';
    let mvpFeatures: MvpFeature[] = [];

    // 1. Photography / Creative Studio / Portfolio
    if (lower.includes('photo') || lower.includes('studio') || lower.includes('slash') || lower.includes('gallery') || lower.includes('portfolio')) {
      const isSlash = lower.includes('slash');
      productName = isSlash ? 'Slash Photo Studio' : 'Creative Studio Portfolio';
      mvpFeatures = [
        { name: 'Photo Gallery & Showcase', priority: 'HIGH' },
        { name: 'Studio Photography Services & Packages', priority: 'HIGH' },
        { name: 'Online Session Booking & Appointment Inquiry', priority: 'HIGH' },
        { name: 'Studio Story, Equipment & Client Reviews', priority: 'MEDIUM' },
        { name: 'Contact Info, Business Hours & Location', priority: 'HIGH' },
      ];
    } else if (lower.includes('todo') || lower.includes('task')) {
      productName = 'TaskBoard';
      mvpFeatures = [
        { name: 'Create tasks', priority: 'HIGH' },
        { name: 'Complete tasks', priority: 'HIGH' },
        { name: 'Task list view', priority: 'HIGH' },
      ];
    } else if (lower.includes('e-commerce') || lower.includes('store') || lower.includes('shop')) {
      productName = 'Storefront';
      mvpFeatures = [
        { name: 'Product catalog', priority: 'HIGH' },
        { name: 'Cart and checkout', priority: 'HIGH' },
        { name: 'Order confirmation', priority: 'MEDIUM' },
      ];
    } else if (lower.includes('hotel') || lower.includes('booking')) {
      productName = 'BookingApp';
      mvpFeatures = [
        { name: 'Room & Space Listings', priority: 'HIGH' },
        { name: 'Date Selection & Reservation', priority: 'HIGH' },
        { name: 'Booking Summary', priority: 'MEDIUM' },
      ];
    } else {
      const words = cleanIdea.split(' ').filter((w) => w.length > 2);
      const mainWord = words[0]
        ? words[0].charAt(0).toUpperCase() + words[0].slice(1)
        : 'App';
      productName = mainWord.slice(0, 24);
      mvpFeatures = [
        { name: 'Main user flow', priority: 'HIGH' },
        { name: 'Basic data create/view', priority: 'HIGH' },
        { name: 'Simple settings', priority: 'MEDIUM' },
      ];
    }

    return {
      productName,
      vision: `Build: ${cleanIdea}`,
      problemStatement: cleanIdea,
      targetAudience: lower.includes('photo') || lower.includes('studio')
        ? 'Clients seeking professional photography & creative services'
        : lower.includes('team') || lower.includes('business')
          ? 'Small teams & businesses'
          : 'General users & clients',
      platform: 'Web application',
      complexity: 'MVP',
      mvpFeatures,
      futureFeatures: ['Client portal & gallery downloads', 'Advanced online payment processing'],
      questions: [],
      clarificationRequired: false,
      approvalRequired: true,
    };
  }

  override async execute(
    task: string,
    _context?: Record<string, unknown>,
  ): Promise<AgentExecutionResult> {
    const spec = await this.discoverProductSpecification(task);
    return {
      success: true,
      output: JSON.stringify(spec, null, 2),
    };
  }
}
