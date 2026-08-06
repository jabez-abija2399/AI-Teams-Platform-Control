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
  /** Kept for pipeline internals; UI should prefer mvpFeatures + timeline */
  aiTeam: AssignedAgent[];
  estimatedTimeline: string;
  risks: string[];
}

function isSimpleScope(spec: ProductSpecification): boolean {
  const blob = `${spec.productName} ${spec.vision} ${spec.problemStatement}`.toLowerCase();
  const featureCount = (spec.mvpFeatures ?? []).length;
  return (
    featureCount <= 5 &&
    (blob.includes('login') ||
      blob.includes('auth') ||
      blob.includes('signup') ||
      blob.includes('sign up') ||
      spec.complexity === 'MVP')
  );
}

function featureDescription(name: string, ideaContext: string): string {
  const n = name.toLowerCase();
  if (n.includes('email') || n.includes('password') || n.includes('authentication')) {
    return 'Users can create an account and sign in securely with email and password.';
  }
  if (n.includes('signup') || n.includes('sign up') || n.includes('login flow')) {
    return 'Clean signup and login screens with clear validation and error messages.';
  }
  if (n.includes('protected') || n.includes('dashboard')) {
    return 'Only signed-in users can open private pages; guests are redirected to login.';
  }
  if (n.includes('profile') || n.includes('settings')) {
    return 'Signed-in users can view and update basic profile details.';
  }
  if (n.includes('logout') || n.includes('sign out')) {
    return 'Users can sign out and clear their session safely.';
  }
  return `Implements “${name}” as described in the idea: ${ideaContext.slice(0, 80)}.`;
}

function scopedFeatures(spec: ProductSpecification): MvpFeature[] {
  const idea = `${spec.vision} ${spec.problemStatement} ${spec.productName}`.toLowerCase();
  const isAuth =
    idea.includes('login') || idea.includes('auth') || idea.includes('signup') || idea.includes('sign up');

  const raw = (spec.mvpFeatures as MvpFeature[]) ?? [];
  const cleaned = raw.filter((feat) => {
    const name = (typeof feat === 'string' ? feat : feat.name).toLowerCase();
    if (!isAuth) return true;
    // Drop unrelated todo/task noise for auth/login ideas
    if (name.includes('task') || name.includes('todo') || name.includes('invoice') || name.includes('booking')) {
      return false;
    }
    return true;
  });

  if (cleaned.length > 0) return cleaned;

  if (isAuth) {
    return [
      { name: 'Email/password login', priority: 'HIGH' },
      { name: 'Sign up page', priority: 'HIGH' },
      { name: 'Protected home page after login', priority: 'HIGH' },
    ];
  }

  return [{ name: 'Core user flow', priority: 'HIGH' }];
}

function scopedFutureFeatures(spec: ProductSpecification): string[] {
  const idea = `${spec.vision} ${spec.problemStatement}`.toLowerCase();
  if (idea.includes('login') || idea.includes('auth') || idea.includes('signup')) {
    return ['Forgot password / reset email', 'Optional social login (Google)'];
  }
  const incoming = (spec.futureFeatures ?? []).filter((f) => {
    const lower = f.toLowerCase();
    // Strip generic enterprise filler when idea is small
    if (isSimpleScope(spec) && (lower.includes('ai productivity') || lower.includes('analytics'))) {
      return false;
    }
    return true;
  });
  return incoming.slice(0, 3);
}

function scopedRisks(spec: ProductSpecification): string[] {
  const idea = `${spec.vision} ${spec.problemStatement}`.toLowerCase();
  if (idea.includes('login') || idea.includes('auth')) {
    return ['Weak password rules or unclear validation', 'Session handling mistakes on protected pages'];
  }
  if (isSimpleScope(spec)) {
    return ['Scope creeping beyond the original simple request'];
  }
  return ['Scope expansion during development', 'External service integration delays'];
}

function leanTeam(spec: ProductSpecification): AssignedAgent[] {
  if (isSimpleScope(spec)) {
    return [
      {
        role: 'PRODUCT_MANAGER',
        title: 'Product Manager AI',
        responsibilities: 'Keep the MVP aligned with the user’s simple request',
      },
      {
        role: 'DEVELOPER',
        title: 'Developer AI',
        responsibilities: 'Build the screens and auth flow',
      },
      {
        role: 'QA',
        title: 'QA AI',
        responsibilities: 'Verify signup, login, and protected routes work',
      },
    ];
  }

  return [
    {
      role: 'CEO',
      title: 'Chief Executive Officer AI',
      responsibilities: 'Product direction and priorities',
    },
    {
      role: 'PRODUCT_MANAGER',
      title: 'Product Manager AI',
      responsibilities: 'Requirements and acceptance criteria',
    },
    {
      role: 'ARCHITECT',
      title: 'Software Architect AI',
      responsibilities: 'System design and technical decisions',
    },
    {
      role: 'DEVELOPER',
      title: 'Developer AI',
      responsibilities: 'Implementation',
    },
    {
      role: 'QA',
      title: 'QA AI',
      responsibilities: 'Testing and quality checks',
    },
  ];
}

function applyUserFeedback(proposal: ProductProposal, feedback: string): ProductProposal {
  const f = feedback.toLowerCase();
  let mvpFeatures = [...proposal.mvpFeatures];
  let futureFeatures = [...proposal.futureFeatures];
  let platform = proposal.platform;
  let complexity = proposal.complexity;
  let tagline = proposal.tagline;
  let productName = proposal.productName;

  const htmlCss =
    (f.includes('html') && f.includes('css')) ||
    f.includes('not next') ||
    f.includes('no next') ||
    f.includes('vanilla') ||
    f.includes('plain html');

  if (htmlCss) {
    platform = 'HTML + CSS (+ light JS)';
    complexity = 'MVP';
    tagline = `${productName} — simple HTML/CSS login experience`;
    mvpFeatures = [
      {
        id: 'feat_1',
        name: 'Login page (HTML/CSS)',
        description: 'Static login.html styled with CSS; form posts email and password.',
        priority: 'HIGH',
      },
      {
        id: 'feat_2',
        name: 'Sign up page (HTML/CSS)',
        description: 'Static signup.html for creating an account.',
        priority: 'HIGH',
      },
      {
        id: 'feat_3',
        name: 'Protected home page',
        description: 'home.html only after login; guests redirected to login.html.',
        priority: 'HIGH',
      },
    ];
    futureFeatures = futureFeatures.filter(
      (x) => !/social|google|oauth|next\.?js|react/i.test(x),
    );
  }

  if (
    f.includes('simpler') ||
    f.includes('too complex') ||
    f.includes('too many') ||
    f.includes('only') ||
    f.includes('just ')
  ) {
    mvpFeatures = mvpFeatures.slice(0, Math.min(3, mvpFeatures.length));
    complexity = 'MVP';
  }

  if (f.includes('no social') || f.includes('remove social') || f.includes('without social')) {
    futureFeatures = futureFeatures.filter((x) => !/social|google|oauth/i.test(x));
    mvpFeatures = mvpFeatures.filter((feat) => !/social|google|oauth/i.test(feat.name));
  }

  const removeMatch = feedback.match(/(?:remove|without|drop|no)\s+([^,.]+)/i);
  if (removeMatch?.[1]) {
    const needle = removeMatch[1].trim().toLowerCase();
    mvpFeatures = mvpFeatures.filter((feat) => !feat.name.toLowerCase().includes(needle));
    futureFeatures = futureFeatures.filter((x) => !x.toLowerCase().includes(needle));
  }

  const addMatch = feedback.match(/(?:add|include|need|want)\s+([^,.]+)/i);
  if (addMatch?.[1]) {
    const name = addMatch[1].trim();
    if (name.length > 2 && !mvpFeatures.some((feat) => feat.name.toLowerCase() === name.toLowerCase())) {
      mvpFeatures.push({
        id: `feat_rev_${mvpFeatures.length + 1}`,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        description: `Added from your feedback: ${name}`,
        priority: 'HIGH',
      });
    }
  }

  if (mvpFeatures.length === 0) {
    mvpFeatures = proposal.mvpFeatures.slice(0, 2);
  }

  return {
    ...proposal,
    id: `prop_${Date.now()}`,
    productName,
    platform,
    complexity,
    tagline: tagline.length > 100 ? `${tagline.slice(0, 97)}…` : tagline,
    vision: htmlCss
      ? `A simple login experience built with HTML and CSS (no Next.js/React). ${feedback.trim()}`
      : `${proposal.vision}\n\nRevised from your feedback: ${feedback.trim()}`,
    problem: htmlCss
      ? `Users need a basic signup/login flow without a heavy framework. Change request: ${feedback.trim()}`
      : `${proposal.problem}\n\nYour change request: ${feedback.trim()}`,
    mvpFeatures,
    futureFeatures,
    risks: htmlCss
      ? ['Keeping forms secure without a framework', 'Session handling on a small server']
      : proposal.risks,
    estimatedTimeline: htmlCss ? '1 – 3 days' : proposal.estimatedTimeline,
    revisionNote: feedback.trim(),
  } as ProductProposal & { revisionNote: string };
}

export class ProductProposalEngine {
  /**
   * Converts a ProductSpecification into a clear ProductProposal.
   * Keeps simple ideas (e.g. login page) small — no enterprise filler.
   * Optional feedback regenerates the proposal with the user's change requests.
   */
  public static generateProposal(
    spec: ProductSpecification,
    _projectId = 'proposal_draft',
    feedback?: string,
  ): ProductProposal {
    const ideaContext = spec.problemStatement || spec.vision || spec.productName;
    const features = scopedFeatures(spec);

    const mvpFeatures: ProposalFeature[] = features.map((feat, idx) => {
      const name = typeof feat === 'string' ? feat : feat.name;
      return {
        id: `feat_${idx + 1}`,
        name,
        description: featureDescription(name, ideaContext),
        priority: typeof feat === 'object' && feat.priority ? feat.priority : 'HIGH',
      };
    });

    const simple = isSimpleScope(spec);
    const tagline = simple
      ? spec.vision.length > 90
        ? `${spec.vision.slice(0, 87)}…`
        : spec.vision
      : `${spec.productName} — ${spec.platform} for ${spec.targetAudience}`;

    const estimatedTimeline =
      spec.complexity === 'MVP' || simple
        ? '3 – 5 days'
        : spec.complexity === 'MODERATE'
          ? '1 – 2 weeks'
          : '2 – 4 weeks';

    const base: ProductProposal = {
      id: `prop_${Date.now()}`,
      productName: spec.productName || 'App',
      tagline,
      vision: spec.vision,
      problem: spec.problemStatement,
      targetAudience: spec.targetAudience,
      platform: spec.platform,
      complexity: simple ? 'MVP' : spec.complexity || 'MVP',
      mvpFeatures,
      futureFeatures: scopedFutureFeatures(spec),
      aiTeam: leanTeam(spec),
      estimatedTimeline,
      risks: scopedRisks(spec),
    };

    const trimmed = feedback?.trim();
    return trimmed ? applyUserFeedback(base, trimmed) : base;
  }
}
