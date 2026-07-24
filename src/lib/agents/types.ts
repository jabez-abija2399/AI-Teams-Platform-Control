import { Annotation } from '@langchain/langgraph';

export interface ArchitecturePlan {
  filesToCreate: string[];
  filesToModify: string[];
  apiContracts: string[];
}

export type AgentStatus = 'PLANNING' | 'CODING' | 'VERIFYING' | 'SUCCESS' | 'FAILED';

export interface AgentStateChannels {
  projectId: string;
  userPrompt: string;
  architecturePlan: ArchitecturePlan;
  generatedFiles: Record<string, string>;
  astContext: string;
  compileErrors: string[];
  retryCount: number;
  status: AgentStatus;
}

/**
 * LangGraph State Annotation definition for Multi-Agent Software Builder
 */
export const AgentStateAnnotation = Annotation.Root({
  projectId: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  userPrompt: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  architecturePlan: Annotation<ArchitecturePlan>({
    reducer: (x, y) => y ?? x ?? { filesToCreate: [], filesToModify: [], apiContracts: [] },
    default: () => ({ filesToCreate: [], filesToModify: [], apiContracts: [] }),
  }),
  generatedFiles: Annotation<Record<string, string>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  astContext: Annotation<string>({
    reducer: (x, y) => y ?? x ?? '',
    default: () => '',
  }),
  compileErrors: Annotation<string[]>({
    reducer: (x, y) => y ?? x ?? [],
    default: () => [],
  }),
  retryCount: Annotation<number>({
    reducer: (x, y) => y ?? x ?? 0,
    default: () => 0,
  }),
  status: Annotation<AgentStatus>({
    reducer: (x, y) => y ?? x ?? 'PLANNING',
    default: () => 'PLANNING',
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
