import { describe, expect, it } from 'vitest';
import {
  buildDeliveryPlanForStack,
  buildStaticHtmlDeliveryPlan,
  todosAllDone,
} from '@/core/company-orchestration/architecture-delivery-plan';

describe('architecture-delivery-plan', () => {
  it('builds static HTML folder tree + todos + QA todos', () => {
    const plan = buildStaticHtmlDeliveryPlan('Demo App');
    expect(plan.fileStructure.length).toBeGreaterThan(3);
    expect(plan.fileStructure.some((f) => f.path === 'login.html')).toBe(true);
    expect(plan.implementationTodos.length).toBeGreaterThan(2);
    expect(plan.qaTodos.length).toBeGreaterThan(0);
    expect(plan.implementationTodos.every((t) => t.files.length > 0)).toBe(true);
  });

  it('picks stack-aware plans', () => {
    const html = buildDeliveryPlanForStack('A', { htmlCss: true, staticNoBackend: true, stack: 'static-html' });
    expect(html.fileStructure.some((f) => f.path.endsWith('.html'))).toBe(true);

    const react = buildDeliveryPlanForStack('B', {
      htmlCss: false,
      staticNoBackend: false,
      stack: 'react-vite',
    });
    expect(react.fileStructure.some((f) => f.path === 'src/App.tsx')).toBe(true);
  });

  it('todosAllDone requires every todo done', () => {
    const plan = buildStaticHtmlDeliveryPlan('X');
    expect(todosAllDone(plan.implementationTodos)).toBe(false);
    expect(
      todosAllDone(plan.implementationTodos.map((t) => ({ ...t, status: 'done' as const }))),
    ).toBe(true);
  });
});
