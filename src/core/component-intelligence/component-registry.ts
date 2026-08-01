import { RegisteredComponent, ComponentSearchDecision } from './types';

export class ComponentRegistryService {
  private static registry: RegisteredComponent[] = [
    {
      id: 'COMP-1',
      name: 'AgentCollaborationTimeline',
      category: 'FEED',
      filePath: 'src/features/collaboration/components/agent-collaboration-timeline.tsx',
      description: 'Real-time chat feed with avatar badge and developer mode telemetry toggle',
      tags: ['chat', 'timeline', 'collaboration', 'telemetry'],
      version: 1,
    },
    {
      id: 'COMP-2',
      name: 'ExecutionDagGraph',
      category: 'GRAPH',
      filePath: 'src/features/observability/components/execution-dag-graph.tsx',
      description: 'Live animated execution DAG pipeline graph',
      tags: ['dag', 'graph', 'execution', 'pipeline'],
      version: 1,
    },
    {
      id: 'COMP-3',
      name: 'ExecutiveReportView',
      category: 'UI',
      filePath: 'src/features/analytics/components/executive-report-view.tsx',
      description: 'CEO dashboard report view detailing velocity, cost, risks, and roadmap',
      tags: ['executive', 'dashboard', 'report', 'metrics'],
      version: 1,
    },
  ];

  public static registerComponent(comp: Omit<RegisteredComponent, 'id' | 'version'>): RegisteredComponent {
    const existing = this.registry.find((c) => c.name === comp.name);
    if (existing) {
      existing.version += 1;
      existing.description = comp.description;
      return existing;
    }

    const newComp: RegisteredComponent = {
      ...comp,
      id: `COMP-${Date.now()}`,
      version: 1,
    };
    this.registry.push(newComp);
    return newComp;
  }

  public static searchOrCheckReuse(desiredFeatureDescription: string): ComponentSearchDecision {
    const lower = desiredFeatureDescription.toLowerCase();

    for (const comp of this.registry) {
      const matchTag = comp.tags.some((t) => lower.includes(t));
      if (matchTag || lower.includes(comp.name.toLowerCase())) {
        return {
          shouldReuse: true,
          matchedComponent: comp,
          similarityScore: 0.92,
          recommendationReason: `Found existing component '${comp.name}' matching keywords (${comp.tags.join(', ')}). Reuse instead of creating a duplicate.`,
        };
      }
    }

    return {
      shouldReuse: false,
      similarityScore: 0.2,
      recommendationReason: 'No existing component matches. Safe to generate a new component.',
    };
  }

  public static getAllComponents(): RegisteredComponent[] {
    return [...this.registry];
  }
}
