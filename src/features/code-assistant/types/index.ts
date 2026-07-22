export interface CodeAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  applied?: boolean;
}

export interface CodeContext {
  fileName?: string;
  language?: string;
  content?: string;
  selectedText?: string;
  cursorLine?: number;
  cursorColumn?: number;
}

export interface CodeAssistantRequest {
  projectId: string;
  message: string;
  context?: CodeContext;
  history?: { role: string; content: string }[];
}

export interface CodeAssistantResponse {
  content: string;
  codeBlock?: string;
  language?: string;
}
