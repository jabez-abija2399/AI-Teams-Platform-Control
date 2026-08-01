import { describe, it, expect } from 'vitest';
import { ArchitectureVisualizer } from '../../src/core/architecture-visualizer/architecture-visualizer';

describe('Phase 24 — Architecture Visualizer', () => {
  it('should generate Mermaid syntax and SVG markup for component and ERD diagrams', () => {
    const compDiagram = ArchitectureVisualizer.generateDiagram('COMPONENT', 'System Components');
    expect(compDiagram.mermaidSyntax).toContain('graph TD');
    expect(compDiagram.svgMarkup).toContain('<svg');

    const erdDiagram = ArchitectureVisualizer.generateDiagram('DATABASE_ERD', 'Database ERD');
    expect(erdDiagram.mermaidSyntax).toContain('erDiagram');
  });

  it('should generate all 9 architecture diagram types', () => {
    const diagrams = ArchitectureVisualizer.generateAllDiagrams();
    expect(diagrams.length).toBe(9);
  });
});
