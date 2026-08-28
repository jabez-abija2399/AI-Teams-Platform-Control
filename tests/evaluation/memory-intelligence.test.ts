import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryManager } from '../../src/packages/agents/memory/memory.manager';

describe('Phase 15 Memory Intelligence Validation', () => {
  let memory: MemoryManager;

  beforeEach(() => {
    memory = new MemoryManager();
  });

  it('should store and retrieve Short-Term Memory (current task and state)', async () => {
    await memory.storeShortTerm('proj-1', {
      type: 'TASK_STATE',
      task: 'Build Contact Form',
      status: 'IN_PROGRESS',
      artifacts: ['form.tsx'],
    });

    const items = await memory.retrieve('proj-1', 'contact form');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.content).toContain('Build Contact Form');
    expect(items[0]?.metadata?.layer).toBe('short_term');
  });

  it('should store and retrieve Long-Term Memory (architecture decisions and preferences)', async () => {
    await memory.storeLongTerm('proj-1', {
      category: 'ARCHITECTURE_DECISION',
      decision: 'Use Next.js 15 Server Components and PostgreSQL',
      justification: 'Best performance and SEO',
    });

    const items = await memory.retrieve('proj-1', 'PostgreSQL');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.content).toContain('Next.js 15 Server Components');
    expect(items[0]?.metadata?.layer).toBe('long_term');
  });

  it('should store Procedural Memory (mistakes/lessons) and inject them into subsequent projects', async () => {
    // First project: QA found missing mobile support
    await memory.storeLesson('proj-alpha', 'DEVELOPER', 'QA found missing mobile support on dashboard grid layout.', {
      fix: 'Always use Tailwind responsive modifiers (sm:, md:, lg:) and verify flex/grid wrapping on mobile viewports.',
    });

    // Second project: Developer receives previous lesson when querying for UI/layout work
    const lessons = await memory.getRelevantLessons('proj-beta', 'DEVELOPER', 'create dashboard grid layout');
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons[0]).toContain('missing mobile support');
    expect(lessons[0]).toContain('Always use Tailwind responsive modifiers');
  });
});
