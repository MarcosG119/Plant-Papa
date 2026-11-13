import { z } from 'zod'

// Bump when a document shape changes in a way readers must branch on.
export const CURRENT_SCHEMA_VERSION = 1 as const

export const schemaVersionSchema = z.number().int().positive()

export type WithSchemaVersion<T extends object> = T & { schemaVersion: number }

// Writes validate through the collection's zod schema, which requires
// schemaVersion — stamping happens here so callers cannot forget it.
export function stampSchemaVersion<T extends object>(data: T): WithSchemaVersion<T> {
  return { ...data, schemaVersion: CURRENT_SCHEMA_VERSION }
}
