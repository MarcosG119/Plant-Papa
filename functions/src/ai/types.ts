// Provider-swappable LLM interface. Screens and data never know which
// provider answered; swapping providers is one factory line plus a secret.
export interface ChatRequest {
  systemPrompt: string
  messages: Array<{ role: 'user' | 'assistant'; text: string }>
  maxTokens?: number
}

export interface ChatReply {
  text: string
  provider: string
  model: string
}

export interface LLMProvider {
  readonly name: string
  chat(req: ChatRequest): Promise<ChatReply>
}
