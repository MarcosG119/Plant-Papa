import { describe, expect, it } from 'vitest'
import {
  buildDetailsUrl,
  buildSearchUrl,
  mapCare,
  mapDetails,
  mapPrecipitation,
  mapSearchRow,
} from './trefleClient'

const growth = {
  minimum_temperature: { deg_c: 10, deg_f: 50 },
  maximum_temperature: { deg_c: 27, deg_f: 80 },
  minimum_precipitation: { mm: 600 },
  maximum_precipitation: { mm: 1200 },
  light: 7,
}

describe('trefle client — regression tests for the three proxy bugs', () => {
  it('bug 1: search passes q as the raw string, never a serialized object', () => {
    const url = buildSearchUrl({ q: 'monstera' }, 'tok')
    const params = new URL(url).searchParams
    expect(params.get('q')).toBe('monstera')
    // The old proxy sent `q: req.query` — the whole object serialized.
    expect(params.get('q')).not.toContain('{')
    expect(url).toContain('https://trefle.io/api/v1/plants/search')
  })

  it('bug 1: page is a separate parameter, still not merged into q', () => {
    const params = new URL(buildSearchUrl({ q: 'fern', page: 3 }, 'tok'))
      .searchParams
    expect(params.get('q')).toBe('fern')
    expect(params.get('page')).toBe('3')
  })

  it('bug 2: temperature range maps minimum→maximum independently', () => {
    const care = mapCare(growth)
    expect(care.tempMin).toBe(10)
    expect(care.tempMax).toBe(27)
    // The old client read minimum_temperature for both ends of the range.
    expect(care.tempMin).not.toBe(care.tempMax)
  })

  it('bug 2: missing temperature bounds stay null', () => {
    const care = mapCare({ minimum_temperature: { deg_c: 10 } })
    expect(care.tempMin).toBe(10)
    expect(care.tempMax).toBeNull()
  })

  it('bug 3: precipitation stays in millimetres and is labeled mm', () => {
    const precip = mapPrecipitation(growth)
    expect(precip.min).toBe(600)
    expect(precip.max).toBe(1200)
    expect(precip.unit).toBe('mm')
    // No mm→"cm" relabeling: values pass through at their original scale.
    expect(precip.min).not.toBe(60)
  })
})

describe('trefle client — response mapping', () => {
  it('maps a search row to the typed summary', () => {
    expect(
      mapSearchRow({
        id: 140063,
        common_name: 'swiss cheese plant',
        scientific_name: 'Monstera adansonii',
        image_url: 'https://trefle.io/img.jpg',
        family_common_name: 'Arum family',
        year: 1753,
      }),
    ).toEqual({
      trefleId: 140063,
      commonName: 'swiss cheese plant',
      scientificName: 'Monstera adansonii',
      imageUrl: 'https://trefle.io/img.jpg',
      familyCommonName: 'Arum family',
    })
  })

  it('maps details with the growth block from main_species', () => {
    const details = mapDetails({
      data: {
        id: 140063,
        common_name: 'swiss cheese plant',
        scientific_name: 'Monstera adansonii',
        image_url: null,
        year: 1753,
        main_species: { growth },
      },
    })
    expect(details.care.tempMin).toBe(10)
    expect(details.care.tempMax).toBe(27)
    expect(details.precipitation.unit).toBe('mm')
    expect(details.light).toBe(7)
    // Trefle has no watering-cadence field — the port never invents one.
    expect(details.care.watering).toBeNull()
    expect(details.care.fertilizing).toBeNull()
  })

  it('builds the details URL with only the token parameter', () => {
    const url = new URL(buildDetailsUrl(140063, 'tok'))
    expect(url.pathname).toBe('/api/v1/plants/140063')
    expect(url.searchParams.get('token')).toBe('tok')
  })
})
