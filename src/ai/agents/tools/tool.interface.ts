export type ToolResult<T> = { success: true; data: T } | { success: false; error: string };

export interface ToolContext {
  projectId: string;
}

export interface ITool<TInput, TOutput> {
  name: string;
  description: string;
  execute(input: TInput, context?: ToolContext): Promise<ToolResult<TOutput>>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  capability: string;
  parameters: Record<string, unknown>;
}
