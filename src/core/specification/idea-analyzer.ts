export interface AnalysisResult {
  coreDomain: string;
  detectedFeatures: string[];
  missingContext: string[];
  targetAudience: string[];
}

export class IdeaAnalyzer {
  public static analyzeIdea(rawIdea: string): AnalysisResult {
    const lower = rawIdea.toLowerCase();
    const detectedFeatures: string[] = [];
    const missingContext: string[] = [];
    const targetAudience: string[] = [];

    // Domain classification
    let coreDomain = 'SaaS Web Application';
    if (lower.includes('shop') || lower.includes('ecommerce') || lower.includes('store')) {
      coreDomain = 'E-Commerce Platform';
    } else if (lower.includes('ai') || lower.includes('agent') || lower.includes('llm')) {
      coreDomain = 'AI Automation Platform';
    } else if (lower.includes('chat') || lower.includes('social')) {
      coreDomain = 'Social Communication System';
    }

    // Feature extraction
    if (lower.includes('user') || lower.includes('login') || lower.includes('auth')) {
      detectedFeatures.push('User Authentication & Role-Based Access Control');
    } else {
      missingContext.push('Authentication mechanism & user roles not specified');
    }

    if (lower.includes('payment') || lower.includes('stripe') || lower.includes('subscription')) {
      detectedFeatures.push('Payment Processing & Billing Subscription');
    }

    if (lower.includes('dash') || lower.includes('analytics') || lower.includes('metric')) {
      detectedFeatures.push('Real-Time Data Dashboard & Analytics');
    }

    // Default features if simple idea
    if (detectedFeatures.length === 0) {
      detectedFeatures.push('Core CRUD Operations', 'Interactive User Dashboard', 'Responsive Layout');
    }

    // Target audience detection
    if (lower.includes('business') || lower.includes('b2b') || lower.includes('team')) {
      targetAudience.push('Enterprise Teams & Business Managers');
    } else {
      targetAudience.push('End Consumers & Everyday Users');
    }

    return {
      coreDomain,
      detectedFeatures,
      missingContext,
      targetAudience,
    };
  }
}
