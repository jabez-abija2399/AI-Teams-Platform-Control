import { describe, it, expect } from 'vitest';
import { DependencyAnalyzer } from '../../src/core/dependency/dependency-analyzer';

describe('Phase 23 — Intelligent Dependency Graph Engine', () => {
  it('should detect code issues, circular dependencies, and component sizes', () => {
    const largeContent = Array(350).fill('const x = 1;').join('\n');
    const fileMap = {
      'src/components/HugeCard.tsx': largeContent,
      'src/components/CircularComponent.tsx': "import { CircularComponent } from './CircularComponent';",
    };

    const report = DependencyAnalyzer.analyzeDependencies(fileMap);

    expect(report.detectedIssues.length).toBeGreaterThan(0);
    expect(report.refactoringSuggestions.length).toBeGreaterThan(0);
    expect(report.graphs.componentGraph.nodes.length).toBeGreaterThan(0);
    expect(report.healthScore).toBeGreaterThan(50);
  });
});
