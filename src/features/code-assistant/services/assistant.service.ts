import { aiGenerate } from '@/ai/gateway/ai.gateway';
import type { CodeContext } from '../types';

const SYSTEM_PROMPT = `You are an expert code assistant embedded in an AI-powered development platform. You help users write, understand, refactor, debug, and improve code.

Rules:
1. Always return valid, working code when asked to generate or modify code.
2. When suggesting code changes, wrap them in a fenced code block with the language tag (e.g. \`\`\`typescript).
3. Be concise and direct. No unnecessary explanations unless asked.
4. When explaining code, be clear and use examples when helpful.
5. When fixing bugs, explain the issue and provide the corrected code.
6. When refactoring, explain what you improved and show the new code.
7. If asked to write tests, write comprehensive unit tests.
8. You can help with any programming language, framework, or tool.
9. Never include secrets, API keys, or credentials in generated code.
10. If the user asks something non-code-related, politely redirect to code topics.`;

function buildUserPrompt(message: string, context?: CodeContext): string {
  const parts: string[] = [];

  if (context) {
    const contextParts: string[] = [];

    if (context.fileName) {
      contextParts.push(`File: ${context.fileName}`);
    }
    if (context.language) {
      contextParts.push(`Language: ${context.language}`);
    }
    if (context.content) {
      const maxContentLength = 8000;
      const truncated =
        context.content.length > maxContentLength
          ? context.content.slice(0, maxContentLength) + '\n... (truncated)'
          : context.content;
      contextParts.push(`File content:\n\`\`\`${context.language || ''}\n${truncated}\n\`\`\``);
    }
    if (context.selectedText) {
      contextParts.push(`Selected text:\n\`\`\`\n${context.selectedText}\n\`\`\``);
    }
    if (context.cursorLine) {
      contextParts.push(`Cursor position: Line ${context.cursorLine}, Column ${context.cursorColumn ?? 0}`);
    }

    if (contextParts.length > 0) {
      parts.push(`Context:\n${contextParts.join('\n')}`);
    }
  }

  parts.push(`User request: ${message}`);
  return parts.join('\n\n');
}

export async function askCodeAssistant(
  message: string,
  context?: CodeContext,
  history?: { role: string; content: string }[],
): Promise<string> {
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  if (history) {
    for (const msg of history.slice(-10)) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }
  }

  messages.push({
    role: 'user',
    content: buildUserPrompt(message, context),
  });

  const response = await aiGenerate({
    messages,
    maxTokens: 4096,
    temperature: 0.3,
  });

  return response.content;
}
