import { describe, expect, it } from 'vitest'
import { MAX_IDENTIFY_IMAGE_BYTES, decodeImagePayload } from './plantnetIdentify'

// Pure unit tests — no emulator. decodeImagePayload throws HttpsError
// (invalid-argument) on bad payloads; the message is what we assert on.
describe('decodeImagePayload', () => {
  const bytes = Buffer.from('fake-jpeg-bytes-1234', 'utf8')
  const base64 = bytes.toString('base64')

  it('decodes bare base64', () => {
    expect(decodeImagePayload(base64)).toEqual(bytes)
  })

  it('decodes a data URL and keeps only the payload bytes', () => {
    expect(decodeImagePayload(`data:image/jpeg;base64,${base64}`)).toEqual(bytes)
  })

  it('rejects invalid base64 instead of silently truncating', () => {
    // Buffer.from ignores the "!" and would decode a shorter buffer —
    // the round-trip check must surface that as invalid-argument.
    expect(() => decodeImagePayload(`${base64}!`)).toThrow('not valid base64')
  })

  it('rejects an empty payload', () => {
    expect(() => decodeImagePayload('')).toThrow('empty')
  })

  it('rejects payloads past the decoded-size ceiling', () => {
    const oversized = Buffer.alloc(MAX_IDENTIFY_IMAGE_BYTES + 1).toString('base64')
    expect(() => decodeImagePayload(oversized)).toThrow(
      `exceeds ${MAX_IDENTIFY_IMAGE_BYTES} bytes`,
    )
  })

  it('accepts payloads at exactly the ceiling', () => {
    const atLimit = Buffer.alloc(MAX_IDENTIFY_IMAGE_BYTES).toString('base64')
    expect(decodeImagePayload(atLimit)).toHaveLength(MAX_IDENTIFY_IMAGE_BYTES)
  })
})
