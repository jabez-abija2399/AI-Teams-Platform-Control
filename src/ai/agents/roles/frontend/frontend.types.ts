import { z } from 'zod';

const smartString = z
  .union([z.string(), z.record(z.string(), z.unknown()), z.array(z.unknown())])
  .transform((val) => {
    if (typeof val === 'string') return val;
    return JSON.stringify(val);
  });

export const appStructureItemSchema = z.object({
  path: smartString.default(''),
  purpose: smartString.default(''),
  type: z.enum(['file', 'directory']).default('file'),
});

export const routeSpecSchema = z.object({
  path: smartString.default(''),
  component: smartString.default(''),
  protected: z.boolean().default(false),
  layout: smartString.default('DashboardLayout'),
});

export const layoutSpecSchema = z.object({
  name: smartString.default(''),
  regions: z.array(smartString).default(['header', 'sidebar', 'main', 'footer']),
  responsiveBreakpoints: z.array(smartString).default(['mobile < 768px', 'tablet 768px-1024px', 'desktop > 1024px']),
});

export const pageSpecSchema = z.object({
  name: smartString.default(''),
  route: smartString.default(''),
  sections: z.array(smartString).default([]),
  stateDependencies: z.array(smartString).default([]),
});

export const componentSpecSchema = z.object({
  name: smartString.default(''),
  props: z.array(smartString).default([]),
  state: z.array(smartString).default([]),
  events: z.array(smartString).default([]),
});

export const hookSpecSchema = z.object({
  name: smartString.default(''),
  purpose: smartString.default(''),
  parameters: z.array(smartString).default([]),
  returnValue: smartString.default(''),
});

export const stateManagementSpecSchema = z.object({
  storeName: smartString.default(''),
  tool: smartString.default('Zustand / Context API'),
  slices: z.array(smartString).default([]),
}).default({ storeName: 'AppStore', tool: 'Zustand / Context API', slices: [] });

export const apiIntegrationSpecSchema = z.object({
  endpoint: smartString.default(''),
  clientMethod: smartString.default('useQuery / fetch'),
  cachingStrategy: smartString.default('TanStack Query SWR'),
});

export const formSpecSchema = z.object({
  name: smartString.default(''),
  fields: z.array(z.object({ name: smartString, type: smartString, validation: smartString })).default([]),
  submitAction: smartString.default(''),
});

export const validationRuleSpecSchema = z.object({
  schemaName: smartString.default(''),
  library: smartString.default('Zod + react-hook-form'),
  rules: z.array(smartString).default([]),
}).default({ schemaName: 'FormSchema', library: 'Zod + react-hook-form', rules: [] });

export const responsiveLayoutSpecSchema = z.object({
  breakpoint: smartString.default('mobile < 768px'),
  behavior: smartString.default('Stack columns vertically, hide sidebar into hamburger menu'),
});

export const perfOptimizationSpecSchema = z.object({
  lazyLoading: z.array(smartString).default(['Heavy components and route code-splitting']),
  memoization: z.array(smartString).default(['useCallback for event handlers passed to children']),
  assetOptimization: smartString.default('Next/Image webp compression and font subsetting'),
}).default({
  lazyLoading: ['Heavy components and route code-splitting'],
  memoization: ['useCallback for event handlers passed to children'],
  assetOptimization: 'Next/Image webp compression and font subsetting',
});

export const accessibilitySpecSchema = z.object({
  wcagLevel: smartString.default('AA'),
  ariaAttributes: z.array(smartString).default(['aria-label on icon buttons', 'role=alert on toast notices']),
  keyboardNav: smartString.default('Full tab index support and focus trapping in modals'),
}).default({
  wcagLevel: 'AA',
  ariaAttributes: ['aria-label on icon buttons', 'role=alert on toast notices'],
  keyboardNav: 'Full tab index support and focus trapping in modals',
});

export const seoSpecSchema = z.object({
  metaTags: z.array(smartString).default(['title', 'description', 'og:image']),
  openGraph: z.boolean().default(true),
  sitemap: z.boolean().default(true),
}).default({ metaTags: ['title', 'description', 'og:image'], openGraph: true, sitemap: true });

export const feTestingStrategySchema = z.object({
  componentTests: smartString.default('Vitest + Testing Library'),
  e2eTests: smartString.default('Playwright automated user flows'),
  coverageTarget: z.number().default(85),
}).default({
  componentTests: 'Vitest + Testing Library',
  e2eTests: 'Playwright automated user flows',
  coverageTarget: 85,
});

export const frontendDesignSpecSchema = z.object({
  applicationStructure: z.array(appStructureItemSchema).default([]),
  routing: z.array(routeSpecSchema).default([]),
  layouts: z.array(layoutSpecSchema).default([]),
  pages: z.array(pageSpecSchema).default([]),
  components: z.array(componentSpecSchema).default([]),
  hooks: z.array(hookSpecSchema).default([]),
  stateManagement: stateManagementSpecSchema,
  apiIntegration: z.array(apiIntegrationSpecSchema).default([]),
  forms: z.array(formSpecSchema).default([]),
  validationRules: z.array(validationRuleSpecSchema).default([]),
  responsiveLayouts: z.array(responsiveLayoutSpecSchema).default([]),
  performanceOptimizations: perfOptimizationSpecSchema,
  accessibility: accessibilitySpecSchema,
  seo: seoSpecSchema,
  testingStrategy: feTestingStrategySchema,
  status: smartString.default('APPROVED'),
});

export type FrontendDesignSpec = z.infer<typeof frontendDesignSpecSchema>;
