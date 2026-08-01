import { describe, it, expect } from 'vitest';
import { frontendDesignSpecSchema } from '../../src/ai/agents/roles/frontend/frontend.types';
import { FrontendAgent } from '../../src/ai/agents/roles/frontend.agent';
import { createAgent } from '../../src/ai/agents/manager/agent.registry';

describe('Frontend Engineer AI Specialist', () => {
  it('should instantiate via direct class and registry', () => {
    const directAgent = new FrontendAgent();
    expect(directAgent.role).toBe('FRONTEND');
    expect(directAgent.name).toBe('Frontend Specialist AI');

    const registryAgent = createAgent('FRONTEND', 'Test FE Engineer');
    expect(registryAgent.role).toBe('FRONTEND');
    expect(registryAgent.name).toBe('Test FE Engineer');
  });

  it('should parse empty or partial object into full frontend design spec with defaults', () => {
    const parsed = frontendDesignSpecSchema.parse({});
    expect(parsed).toBeDefined();
    expect(parsed.status).toBe('APPROVED');
    expect(parsed.pages).toEqual([]);
    expect(parsed.accessibility.wcagLevel).toBe('AA');
    expect(parsed.testingStrategy.coverageTarget).toBe(85);
  });

  it('should parse complete frontend design spec structure correctly', () => {
    const sampleInput = {
      applicationStructure: [{ path: 'src/components', purpose: 'UI Components', type: 'directory' }],
      routing: [{ path: '/dashboard', component: 'DashboardPage', protected: true, layout: 'DashboardLayout' }],
      layouts: [{ name: 'DashboardLayout', regions: ['sidebar', 'main'], responsiveBreakpoints: ['mobile'] }],
      pages: [{ name: 'DashboardPage', route: '/dashboard', sections: ['Stats'], stateDependencies: ['user'] }],
      components: [{ name: 'StatCard', props: ['title', 'value'], state: [], events: ['onClick'] }],
      hooks: [{ name: 'useStats', purpose: 'Fetch analytics', parameters: ['period'], returnValue: 'data' }],
      stateManagement: { storeName: 'AnalyticsStore', tool: 'Zustand', slices: ['stats'] },
      apiIntegration: [{ endpoint: '/api/v1/stats', clientMethod: 'useQuery', cachingStrategy: 'SWR' }],
      forms: [{ name: 'FilterForm', fields: [{ name: 'range', type: 'select', validation: 'required' }], submitAction: 'onFilter' }],
      validationRules: [{ schemaName: 'FilterSchema', library: 'Zod', rules: ['min 1'] }],
      responsiveLayouts: [{ breakpoint: 'mobile', behavior: 'stack' }],
      performanceOptimizations: { lazyLoading: ['Charts'], memoization: ['Cards'], assetOptimization: 'webp' },
      accessibility: { wcagLevel: 'AAA', ariaAttributes: ['aria-label'], keyboardNav: 'enabled' },
      seo: { metaTags: ['title'], openGraph: true, sitemap: true },
      testingStrategy: { componentTests: 'Vitest', e2eTests: 'Playwright', coverageTarget: 90 },
      status: 'APPROVED',
    };

    const parsed = frontendDesignSpecSchema.parse(sampleInput);
    expect(parsed.applicationStructure[0]?.path).toBe('src/components');
    expect(parsed.routing[0]?.path).toBe('/dashboard');
    expect(parsed.accessibility.wcagLevel).toBe('AAA');
  });
});
