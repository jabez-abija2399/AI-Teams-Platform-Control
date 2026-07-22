import { generate } from '@/ai/services/ai.service';

const PLAIN_SUMMARY_SYSTEM = `You are a technical translator. Convert complex architecture into plain language for non-technical stakeholders.

Rules:
- Use short sentences
- No jargon — or explain it simply
- Use analogies where helpful
- Focus on "what it does" not "how it works"
- Keep it under 200 words`;

export async function generatePlainSummary(projectId: string, architecture: unknown): Promise<string> {
  const input = typeof architecture === 'string' ? architecture : JSON.stringify(architecture, null, 2);

  const result = await generate(
    {
      systemPrompt: PLAIN_SUMMARY_SYSTEM,
      messages: [{ role: 'user', content: `Summarize this architecture in plain language:\n\n${input}` }],
      temperature: 0.3,
      maxTokens: 500,
    },
    { projectId },
  );

  if (!result.success) throw new Error(result.error.message);
  return result.data.content;
}
