import { onCall } from 'firebase-functions/v2/https'
import { z } from 'zod'
import { fetchJson } from '../lib/http'
import { requireAuth } from '../lib/guards'
import { invalidArgument, internalError, notFound } from '../lib/errors'
import { buildDetailsUrl, mapDetails, type RawDetailResponse } from './trefleClient'

const inputSchema = z.object({
  trefleId: z.number().int().positive(),
})

export const trefleDetails = onCall(
  { secrets: ['TREFLE_API_KEY'] },
  async (request) => {
    requireAuth(request)
    const parsed = inputSchema.safeParse(request.data)
    if (!parsed.success) {
      throw invalidArgument('Expected { trefleId: number }.')
    }
    const token = process.env.TREFLE_API_KEY
    if (!token) {
      throw internalError('Trefle API key is not configured.')
    }
    try {
      const raw = await fetchJson<RawDetailResponse>(
        buildDetailsUrl(parsed.data.trefleId, token),
      )
      return mapDetails(raw)
    } catch (err) {
      // Trefle answers 404 for unknown ids; surface it as not-found and let
      // everything else bubble as internal.
      if (err instanceof Error && err.message.endsWith('returned 404')) {
        throw notFound(`No Trefle plant with id ${parsed.data.trefleId}.`)
      }
      throw err
    }
  },
)
