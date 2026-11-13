import type { CareProfile } from '@plant-papa/schemas'

// Versioned server-side constant — bump PROMPT_VERSION when the wording
// changes so stored replies can be attributed to a prompt generation.
export const PROMPT_VERSION = 1

export function formatCare(care: CareProfile | null): string {
  if (!care) return 'unknown'
  const parts: string[] = []
  if (care.tempMin !== null || care.tempMax !== null) {
    parts.push(`temp ${care.tempMin ?? '?'}–${care.tempMax ?? '?'}°C`)
  }
  if (care.watering) parts.push(`watering: ${care.watering}`)
  if (care.fertilizing) parts.push(`fertilizing: ${care.fertilizing}`)
  return parts.length > 0 ? parts.join(', ') : 'unknown'
}

export function buildSystemPrompt(
  species: string,
  care: CareProfile | null,
): string {
  return (
    `You are Plant Papa's plant helper. The plant is ${species}. ` +
    `Care profile: ${formatCare(care)}. ` +
    "Answer briefly, warmly, and practically; if you're unsure, say so."
  )
}
