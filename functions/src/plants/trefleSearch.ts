import { onCall } from 'firebase-functions/v2/https'
import { z } from 'zod'
import { fetchJson } from '../lib/http'
import { requireAuth } from '../lib/guards'
import { invalidArgument, internalError } from '../lib/errors'
import {
  buildSearchUrl,
  mapSearchRow,
  type RawSearchResponse,
} from './trefleClient'

const inputSchema = z.object({
  q: z.string().min(1).max(100),
  page: z.number().int().positive().optional(),
})

export const trefleSearch = onCall(
  { secrets: ['TREFLE_API_KEY'] },
  async (request) => {
    requireAuth(request)
    const parsed = inputSchema.safeParse(request.data)
    if (!parsed.success) {
      throw invalidArgument('Expected { q: string, page?: number }.')
    }
    const token = process.env.TREFLE_API_KEY
    if (!token) {
      throw internalError('Trefle API key is not configured.')
    }
    const raw = await fetchJson<RawSearchResponse>(
      buildSearchUrl(parsed.data, token),
    )
    return {
      results: raw.data.map(mapSearchRow),
      page: parsed.data.page ?? 1,
      hasNext: Boolean(raw.links?.next),
    }
  },
)
