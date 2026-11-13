import { onCall } from 'firebase-functions/v2/https'
import { z } from 'zod'
import { fetchJson } from '../lib/http'
import { requireAuth } from '../lib/guards'
import { invalidArgument, internalError } from '../lib/errors'
import {
  buildSearchUrl,
  mapCare,
  mapSearchRow,
  type RawSearchResponse,
} from './trefleClient'

// Callable requests cap at ~10 MiB; base64 inflates bytes by 4/3, so the
// decoded image must stay well under it. The client downscales to 1600px
// JPEG before sending — 5 MiB decoded is a generous ceiling for that.
export const MAX_IDENTIFY_IMAGE_BYTES = 5 * 1024 * 1024

const inputSchema = z.object({
  // Base64 image bytes (bare or a data: URL) — the photo lives in the
  // request, not in Storage: nothing is stored until the plant is saved.
  image: z.string().min(1),
})

interface RawPlantNetResult {
  score: number
  species: {
    scientificNameWithoutAuthor: string
    genus?: { scientificNameWithoutAuthor?: string }
    family?: { scientificNameWithoutAuthor?: string }
    commonNames?: string[]
  }
  images?: Array<{ url?: { o?: string; m?: string } }>
}

interface RawIdentifyResponse {
  results?: RawPlantNetResult[]
}

export interface IdentifiedCandidate {
  scientificName: string
  commonName: string | null
  family: string | null
  score: number
  imageUrl: string | null
  // Enriched from Trefle when the species is found there — care data and the
  // trefleId ride along so the confirm screen can attach them on add.
  trefleId: number | null
  commonNameTrefle: string | null
  care: ReturnType<typeof mapCare> | null
}

// Decodes the identify payload's image field to raw bytes. Accepts a data
// URL ("data:image/jpeg;base64,...") or bare base64.
export function decodeImagePayload(image: string): Buffer {
  const base64 = /^data:image\/[a-z+.-]+;base64,([A-Za-z0-9+/=\r\n]+)$/.exec(image)?.[1] ?? image
  const bytes = Buffer.from(base64, 'base64')
  // Buffer.from silently skips invalid characters — the round-trip compare
  // rejects corrupted payloads instead of identifying from truncated bytes.
  if (bytes.toString('base64') !== base64) {
    throw invalidArgument('image is not valid base64.')
  }
  if (bytes.length === 0) {
    throw invalidArgument('image payload is empty.')
  }
  if (bytes.length > MAX_IDENTIFY_IMAGE_BYTES) {
    throw invalidArgument(
      `image exceeds ${MAX_IDENTIFY_IMAGE_BYTES} bytes after decoding.`,
    )
  }
  return bytes
}

// Top-5 PlantNet candidates, each best-effort enriched through a Trefle search
// so the confirm screen shows care data without another round trip.
export async function mapCandidates(
  results: RawPlantNetResult[],
  token: string,
): Promise<IdentifiedCandidate[]> {
  return Promise.all(
    results.slice(0, 5).map(async (result) => {
      const scientificName = result.species.scientificNameWithoutAuthor
      const imageUrl =
        result.images?.[0]?.url?.m ?? result.images?.[0]?.url?.o ?? null
      const base: IdentifiedCandidate = {
        scientificName,
        commonName: result.species.commonNames?.[0] ?? null,
        family: result.species.family?.scientificNameWithoutAuthor ?? null,
        score: result.score,
        imageUrl,
        trefleId: null,
        commonNameTrefle: null,
        care: null,
      }
      try {
        const search = await fetchJson<RawSearchResponse>(
          buildSearchUrl({ q: scientificName }, token),
        )
        const match = search.data[0]
        if (match) {
          const mapped = mapSearchRow(match)
          base.trefleId = mapped.trefleId
          base.commonNameTrefle = mapped.commonName
          const detail = await fetchJson<{
            data: { growth?: Parameters<typeof mapCare>[0] | null; main_species?: { growth?: Parameters<typeof mapCare>[0] | null } | null }
          }>(`https://trefle.io/api/v1/plants/${mapped.trefleId}?token=${encodeURIComponent(token)}`)
          base.care = mapCare(detail.data.growth ?? detail.data.main_species?.growth ?? null)
        }
      } catch {
        // Trefle enrichment is best-effort: the candidate still stands on its
        // PlantNet data when Trefle is down or the species is unknown there.
      }
      return base
    }),
  )
}

export const plantnetIdentify = onCall(
  { secrets: ['PLANTNET_API_KEY', 'TREFLE_API_KEY'] },
  async (request) => {
    requireAuth(request)
    const parsed = inputSchema.safeParse(request.data)
    if (!parsed.success) {
      throw invalidArgument('Expected { image: string }.')
    }
    const apiKey = process.env.PLANTNET_API_KEY
    const trefleToken = process.env.TREFLE_API_KEY
    if (!apiKey || !trefleToken) {
      throw internalError('PlantNet or Trefle API key is not configured.')
    }
    const bytes = decodeImagePayload(parsed.data.image)
    const form = new FormData()
    form.append('organs', 'flower')
    form.append('organs', 'leaf')
    form.append('organs', 'habit')
    form.append('images', new Blob([bytes], { type: 'image/jpeg' }), 'identify.jpg')
    const raw = await fetchJson<RawIdentifyResponse>(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${encodeURIComponent(apiKey)}`,
      { method: 'POST', body: form },
    )
    const candidates = await mapCandidates(raw.results ?? [], trefleToken)
    return { candidates }
  },
)
