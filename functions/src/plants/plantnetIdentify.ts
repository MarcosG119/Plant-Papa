import { getStorage } from 'firebase-admin/storage'
import { onCall } from 'firebase-functions/v2/https'
import { z } from 'zod'
import { fetchBinary, fetchJson } from '../lib/http'
import { requireAuth } from '../lib/guards'
import { invalidArgument, internalError } from '../lib/errors'
import {
  buildSearchUrl,
  mapCare,
  mapSearchRow,
  type RawSearchResponse,
} from './trefleClient'

const inputSchema = z.object({
  // gs:// object path uploaded by the client, or an https URL.
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

// gs:// objects are read through the admin Storage SDK; https URLs through
// plain fetch. Both land in the same byte buffer for PlantNet.
async function downloadImage(image: string, bucketName: string): Promise<Buffer> {
  if (image.startsWith('gs://')) {
    const withoutScheme = image.slice('gs://'.length)
    const slash = withoutScheme.indexOf('/')
    const bucket = withoutScheme.slice(0, slash)
    const objectPath = withoutScheme.slice(slash + 1)
    if (bucket !== bucketName) {
      throw invalidArgument('Image must be uploaded to the app bucket.')
    }
    const [bytes] = await getStorage()
      .bucket(bucketName)
      .file(objectPath)
      .download()
    return bytes
  }
  if (image.startsWith('https://')) {
    return Buffer.from(await fetchBinary(image))
  }
  throw invalidArgument('image must be a gs:// or https:// URL.')
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
    const bucketName = process.env.GCLOUD_PROJECT
      ? `${process.env.GCLOUD_PROJECT}.appspot.com`
      : ''
    if (!bucketName) {
      throw internalError('Storage bucket is not configured.')
    }
    const bytes = await downloadImage(parsed.data.image, bucketName)
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
