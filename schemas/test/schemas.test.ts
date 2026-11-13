import { describe, expect, it } from 'vitest'
import {
  careLogEventSchema,
  chatMessageSchema,
  chatSchema,
  CURRENT_SCHEMA_VERSION,
  firestoreTimestampSchema,
  noteSchema,
  photoSchema,
  plantSchema,
  stampSchemaVersion,
  storageUrlSchema,
  userProfileSchema,
  usernameRegistrySchema,
  usernameSchema,
} from '../src'

const ts = { seconds: 1_699_000_000, nanoseconds: 0 }

const userDoc = stampSchemaVersion({
  displayName: 'Marcos',
  photoURL: null,
  username: 'Marcos_G',
  usernameLower: 'marcos_g',
  createdAt: ts,
})

const plantDoc = stampSchemaVersion({
  name: 'Monty',
  species: 'Monstera adansonii',
  trefleId: 123456,
  mainImage: 'gs://plant-papa.appspot.com/users/u1/plants/p1/photo.jpg',
  care: {
    tempMin: 18,
    tempMax: 27,
    watering: 'Average water needs',
    fertilizing: 'Feed monthly in growing season',
  },
  lastWateredAt: ts,
  lastFertilizedAt: null,
  createdAt: ts,
})

const careLogDoc = stampSchemaVersion({ type: 'water', at: ts, note: 'thirsty' })

const noteDoc = stampSchemaVersion({ text: 'new leaf unfurling', createdAt: ts, updatedAt: ts })

const photoDoc = stampSchemaVersion({
  url: 'gs://plant-papa.appspot.com/users/u1/plants/p1/photo.jpg',
  takenAt: ts,
  caption: 'week 3',
})

const chatDoc = stampSchemaVersion({ createdAt: ts, lastMessageAt: ts })

const chatMessageDoc = stampSchemaVersion({ role: 'user', text: 'why are tips browning?', sentAt: ts })

describe('version stamping', () => {
  it('stamps the current schema version', () => {
    expect(stampSchemaVersion({ text: 'x' })).toEqual({
      text: 'x',
      schemaVersion: CURRENT_SCHEMA_VERSION,
    })
  })

  it('rejects documents missing schemaVersion', () => {
    const { schemaVersion: _omitted, ...unstamped } = plantDoc
    expect(plantSchema.safeParse(unstamped).success).toBe(false)
  })
})

describe('firestoreTimestampSchema', () => {
  it('accepts a Firestore-shaped timestamp', () => {
    expect(firestoreTimestampSchema.parse(ts)).toMatchObject(ts)
  })

  it('rejects out-of-range nanoseconds and negative seconds', () => {
    expect(firestoreTimestampSchema.safeParse({ seconds: -1, nanoseconds: 0 }).success).toBe(false)
    expect(firestoreTimestampSchema.safeParse({ seconds: 0, nanoseconds: 1_000_000_000 }).success).toBe(false)
  })
})

describe('storageUrlSchema', () => {
  it('accepts gs:// and https:// URLs', () => {
    expect(storageUrlSchema.safeParse('gs://bucket/path.jpg').success).toBe(true)
    expect(storageUrlSchema.safeParse('https://example.com/path.jpg').success).toBe(true)
  })

  it('rejects other schemes', () => {
    expect(storageUrlSchema.safeParse('http://example.com/path.jpg').success).toBe(false)
    expect(storageUrlSchema.safeParse('/local/path.jpg').success).toBe(false)
  })
})

describe('usernameSchema', () => {
  it('accepts 3-20 chars of letters, digits, underscore', () => {
    expect(usernameSchema.safeParse('abc_123').success).toBe(true)
  })

  it('rejects too-short, too-long, or invalid characters', () => {
    expect(usernameSchema.safeParse('ab').success).toBe(false)
    expect(usernameSchema.safeParse('a'.repeat(21)).success).toBe(false)
    expect(usernameSchema.safeParse('has space').success).toBe(false)
  })
})

describe('userProfileSchema', () => {
  it('accepts a representative profile', () => {
    expect(userProfileSchema.parse(userDoc)).toMatchObject({ username: 'Marcos_G' })
  })

  it('rejects usernameLower that is not the lowercased username', () => {
    expect(userProfileSchema.safeParse({ ...userDoc, usernameLower: 'other' }).success).toBe(false)
  })

  it('rejects an invalid username and a malformed createdAt', () => {
    expect(userProfileSchema.safeParse({ ...userDoc, username: 'no-good' }).success).toBe(false)
    expect(userProfileSchema.safeParse({ ...userDoc, createdAt: '2026-01-01' }).success).toBe(false)
  })
})

describe('usernameRegistrySchema', () => {
  it('accepts a registry document', () => {
    expect(usernameRegistrySchema.parse(stampSchemaVersion({ uid: 'uid_1' }))).toMatchObject({ uid: 'uid_1' })
  })

  it('rejects an empty uid', () => {
    expect(usernameRegistrySchema.safeParse(stampSchemaVersion({ uid: '' })).success).toBe(false)
  })
})

describe('plantSchema', () => {
  it('accepts a Trefle-backed plant', () => {
    expect(plantSchema.parse(plantDoc)).toMatchObject({ name: 'Monty' })
  })

  it('accepts a custom plant with no species, trefle id, or care', () => {
    const custom = stampSchemaVersion({
      ...plantDoc,
      species: null,
      trefleId: null,
      care: null,
      mainImage: null,
    })
    expect(plantSchema.parse(custom)).toMatchObject({ trefleId: null, care: null })
  })

  it('rejects a negative trefleId and a care block with a missing field', () => {
    expect(plantSchema.safeParse({ ...plantDoc, trefleId: -1 }).success).toBe(false)
    expect(
      plantSchema.safeParse({
        ...plantDoc,
        care: { tempMin: 18, tempMax: 27, watering: 'x' },
      }).success,
    ).toBe(false)
  })

  it('rejects a non-timestamp lastWateredAt', () => {
    expect(plantSchema.safeParse({ ...plantDoc, lastWateredAt: 42 }).success).toBe(false)
  })
})

describe('careLogEventSchema', () => {
  it('accepts water and fertilize events, with and without notes', () => {
    expect(careLogEventSchema.parse(careLogDoc)).toMatchObject({ type: 'water' })
    expect(careLogEventSchema.parse({ ...careLogDoc, note: undefined })).toMatchObject({ type: 'water' })
    expect(careLogEventSchema.parse({ ...careLogDoc, type: 'fertilize', note: undefined })).toMatchObject({ type: 'fertilize' })
  })

  it('rejects unknown event types and empty notes', () => {
    expect(careLogEventSchema.safeParse({ ...careLogDoc, type: 'prune' }).success).toBe(false)
    expect(careLogEventSchema.safeParse({ ...careLogDoc, note: '' }).success).toBe(false)
  })
})

describe('noteSchema', () => {
  it('accepts a representative note', () => {
    expect(noteSchema.parse(noteDoc)).toMatchObject({ text: 'new leaf unfurling' })
  })

  it('rejects empty or oversized text', () => {
    expect(noteSchema.safeParse({ ...noteDoc, text: '' }).success).toBe(false)
    expect(noteSchema.safeParse({ ...noteDoc, text: 'x'.repeat(5001) }).success).toBe(false)
  })
})

describe('photoSchema', () => {
  it('accepts a representative photo', () => {
    expect(photoSchema.parse(photoDoc)).toMatchObject({ caption: 'week 3' })
  })

  it('rejects a non-storage url', () => {
    expect(photoSchema.safeParse({ ...photoDoc, url: 'file:///img.jpg' }).success).toBe(false)
  })
})

describe('chatSchema', () => {
  it('accepts a chat document with or without a title', () => {
    expect(chatSchema.parse(chatDoc)).toMatchObject({ createdAt: ts })
    expect(chatSchema.parse({ ...chatDoc, title: 'Monty' })).toMatchObject({ title: 'Monty' })
  })

  it('rejects a missing lastMessageAt', () => {
    const { lastMessageAt: _omitted, ...incomplete } = chatDoc
    expect(chatSchema.safeParse(incomplete).success).toBe(false)
  })
})

describe('chatMessageSchema', () => {
  it('accepts user and assistant messages', () => {
    expect(chatMessageSchema.parse(chatMessageDoc)).toMatchObject({ role: 'user' })
    expect(chatMessageSchema.parse({ ...chatMessageDoc, role: 'assistant' })).toMatchObject({ role: 'assistant' })
  })

  it('rejects unknown roles, empty text, and text over the 2000-char cap', () => {
    expect(chatMessageSchema.safeParse({ ...chatMessageDoc, role: 'system' }).success).toBe(false)
    expect(chatMessageSchema.safeParse({ ...chatMessageDoc, text: '' }).success).toBe(false)
    expect(chatMessageSchema.safeParse({ ...chatMessageDoc, text: 'x'.repeat(2001) }).success).toBe(false)
  })
})
