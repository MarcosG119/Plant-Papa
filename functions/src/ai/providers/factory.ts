import { internalError } from '../../lib/errors'
import type { LLMProvider } from '../types'
import { OpenAIProvider } from './openai'

// Swapping providers = one line here + one secret. The env override exists so
// a staged provider can be tested without a code change.
export function makeProvider(name = process.env.LLM_PROVIDER ?? 'openai'): LLMProvider {
  switch (name) {
    case 'openai': {
      const apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) throw internalError('OpenAI API key is not configured.')
      return new OpenAIProvider(apiKey)
    }
    // case 'anthropic': — stub interface for the future swap
    default:
      throw internalError(`Unknown LLM provider: ${name}`)
  }
}
