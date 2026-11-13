import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// The llmChat rate-limit guard queries chat messages with
// role == 'user' AND sentAt >= <one hour ago>. That shape needs a composite
// index on messages(role ASC, sentAt ASC); the Firestore emulator answers it
// without one, so a removed index passes local tests and still breaks every
// production send with an uncaught FAILED_PRECONDITION (surfaced to clients
// as a generic INTERNAL). This test pins the index in the deploy config.

interface IndexField {
  fieldPath: string
  order: string
}

interface IndexConfig {
  collectionGroup: string
  queryScope: string
  fields: IndexField[]
}

const indexesPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../firestore.indexes.json',
)

function loadIndexes(): IndexConfig[] {
  return JSON.parse(readFileSync(indexesPath, 'utf8')).indexes as IndexConfig[]
}

describe('firestore indexes', () => {
  it('declares the composite index llmChat rate-limit query requires', () => {
    const required = { collectionGroup: 'messages', fields: ['role', 'sentAt'] }
    const match = loadIndexes().some(
      (index) =>
        index.collectionGroup === required.collectionGroup &&
        index.queryScope === 'COLLECTION' &&
        required.fields.every((path) =>
          index.fields.some((field) => field.fieldPath === path),
        ),
    )
    expect(match, `missing composite index for ${required.collectionGroup}(${required.fields.join(', ')})`).toBe(true)
  })
})
