import type { CareProfile } from '@plant-papa/schemas'

// Pure Trefle mapping: request building and response shaping with no I/O, so
// the three ported-from-the-proxy bug fixes are unit-testable in isolation.
const TREFLE_BASE = 'https://trefle.io/api/v1'

export interface PlantSummary {
  trefleId: number
  commonName: string | null
  scientificName: string
  imageUrl: string | null
  familyCommonName: string | null
}

export interface PrecipitationRange {
  min: number | null
  max: number | null
  // Trefle reports precipitation in millimetres; the label travels with the
  // data so no client ever has to guess (the old proxy displayed mm as "cm").
  unit: 'mm'
}

export interface PlantDetails {
  trefleId: number
  commonName: string | null
  scientificName: string
  imageUrl: string | null
  familyCommonName: string | null
  year: number | null
  care: CareProfile
  precipitation: PrecipitationRange
  light: number | null
}

interface RawLink {
  self?: string
}

interface RawTemperature {
  deg_c?: number | null
  deg_f?: number | null
}

interface RawPrecipitation {
  mm?: number | null
}

export interface RawGrowth {
  minimum_temperature?: RawTemperature | null
  maximum_temperature?: RawTemperature | null
  minimum_precipitation?: RawPrecipitation | null
  maximum_precipitation?: RawPrecipitation | null
  light?: number | null
}

export interface RawTreflePlant {
  id: number
  common_name?: string | null
  scientific_name?: string | null
  image_url?: string | null
  family_common_name?: string | null
  year?: number | null
  main_species?: { growth?: RawGrowth | null } | null
  growth?: RawGrowth | null
}

export interface RawSearchResponse {
  data: RawTreflePlant[]
  links?: RawLink & { next?: string | null }
}

export interface RawDetailResponse {
  data: RawTreflePlant
}

export interface SearchQuery {
  q: string
  page?: number
}

// Bug fix 1 of 3: `q` goes over the wire as the raw search string. The old
// Express proxy passed `q: req.query` — the whole query object — so Trefle
// received a serialized object instead of the term.
export function buildSearchUrl(query: SearchQuery, token: string): string {
  const params = new URLSearchParams({ token, q: query.q })
  if (query.page !== undefined && query.page > 1) {
    params.set('page', String(query.page))
  }
  return `${TREFLE_BASE}/plants/search?${params.toString()}`
}

export function buildDetailsUrl(trefleId: number, token: string): string {
  const params = new URLSearchParams({ token })
  return `${TREFLE_BASE}/plants/${trefleId}?${params.toString()}`
}

export function mapSearchRow(raw: RawTreflePlant): PlantSummary {
  return {
    trefleId: raw.id,
    commonName: raw.common_name ?? null,
    scientificName: raw.scientific_name ?? '',
    imageUrl: raw.image_url ?? null,
    familyCommonName: raw.family_common_name ?? null,
  }
}

// Bug fix 2 of 3: temperature bounds come from minimum→maximum. The old
// client read `minimum_temperature` for both ends of the range.
// Trefle has no watering-cadence field, so watering/fertilizing stay null and
// the mobile UI renders its own guidance — never invented care data.
export function mapCare(growth: RawGrowth | null | undefined): CareProfile {
  return {
    tempMin: growth?.minimum_temperature?.deg_c ?? null,
    tempMax: growth?.maximum_temperature?.deg_c ?? null,
    watering: null,
    fertilizing: null,
  }
}

export function mapPrecipitation(
  growth: RawGrowth | null | undefined,
): PrecipitationRange {
  return {
    min: growth?.minimum_precipitation?.mm ?? null,
    max: growth?.maximum_precipitation?.mm ?? null,
    unit: 'mm', // Bug fix 3 of 3: keep the native unit, label it honestly.
  }
}

export function mapDetails(raw: RawDetailResponse): PlantDetails {
  // Trefle details put the growth block on the plant itself and repeat it on
  // main_species; either location is accepted.
  const growth = raw.data.growth ?? raw.data.main_species?.growth ?? null
  return {
    trefleId: raw.data.id,
    commonName: raw.data.common_name ?? null,
    scientificName: raw.data.scientific_name ?? '',
    imageUrl: raw.data.image_url ?? null,
    familyCommonName: raw.data.family_common_name ?? null,
    year: raw.data.year ?? null,
    care: mapCare(growth),
    precipitation: mapPrecipitation(growth),
    light: growth?.light ?? null,
  }
}
