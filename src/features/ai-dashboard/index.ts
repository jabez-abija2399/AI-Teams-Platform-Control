// This file serves as the public API boundary for the ai-dashboard feature.
// According to Feature-Sliced Design (FSD), the Next.js app router should ONLY import from this index file,
// never directly from the deep internal folders (e.g., components/, hooks/).

export { AgentRoster } from './components/agent-roster';
export { PipelineVisualizer } from './components/pipeline-visualizer';
