import { z } from 'zod'
import { invalidArgument } from './errors'

// Firestore writes must carry REAL admin Timestamp instances. zod's
// z.object().passthrough() CLONES its input — a Timestamp becomes a plain
// {seconds, nanoseconds} map, which Firestore stores as a map, breaking every
// range query and orderBy on that field. So function writes validate the
// shape and persist the ORIGINAL object, never the parsed clone.
export function assertValid<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw invalidArgument(
      result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; '),
    )
  }
  return value as T
}
