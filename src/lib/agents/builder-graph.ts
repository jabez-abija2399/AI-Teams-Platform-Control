import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentStateAnnotation, AgentState } from './types';
import { architectNode } from './nodes/architect.node';
import { coderNode } from './nodes/coder.node';
import { qaNode } from './nodes/qa.node';

/**
 * LangGraph Multi-Agent Orchestration State Graph
 * Coordinates Architect -> Coder -> QA Verification with Compiler-Gated Self-Healing Loop.
 */
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode('architect', architectNode)
  .addNode('coder', coderNode)
  .addNode('qa', qaNode)
  .addEdge(START, 'architect')
  .addEdge('architect', 'coder')
  .addEdge('coder', 'qa')
  .addConditionalEdges('qa', (state: AgentState) => {
    if (state.compileErrors.length === 0) {
      console.log(`[LangGraph Orchestrator] QA Check Passed! Build succeeded for project: ${state.projectId}`);
      return END;
    }

    if (state.retryCount < 3) {
      console.warn(`[LangGraph Orchestrator] QA Failed. Routing back to Coder node (Retry ${state.retryCount + 1}/3)...`);
      return 'coder';
    }

    console.error(`[LangGraph Orchestrator] Maximum retries (3) reached. Build failed for project: ${state.projectId}`);
    return END;
  });

export const builderGraph = workflow.compile();
