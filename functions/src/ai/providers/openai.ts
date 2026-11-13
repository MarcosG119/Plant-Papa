import type { ChatReply, ChatRequest, LLMProvider } from '../types'

// One constant — changing the model tier is a one-line change.
const MODEL = 'gpt-4o-mini'

interface RawCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>
}

export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai'

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async chat(req: ChatRequest): Promise<ChatReply> {
    const response = await this.fetchImpl(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: req.systemPrompt },
            ...req.messages.map((m) => ({ role: m.role, content: m.text })),
          ],
          max_tokens: req.maxTokens ?? 500,
        }),
      },
    )
    if (!response.ok) {
      throw new Error(`OpenAI request returned ${response.status}`)
    }
    const raw = (await response.json()) as RawCompletionResponse
    const text = raw.choices?.[0]?.message?.content
    if (!text) {
      throw new Error('OpenAI returned an empty completion.')
    }
    return { text, provider: this.name, model: MODEL }
  }
}
