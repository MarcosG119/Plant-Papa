// All outbound HTTP (Trefle, PlantNet, OpenAI) goes through here so every
// external call has a timeout and one error shape.
export async function fetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const { timeoutMs = 15000, ...rest } = init ?? {}
  let response: Response
  try {
    response = await fetch(url, {
      ...rest,
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    throw new Error(`Request to ${url} failed: ${String(err)}`)
  }
  if (!response.ok) {
    throw new Error(`Request to ${url} returned ${response.status}`)
  }
  return (await response.json()) as T
}

export async function fetchBinary(
  url: string,
  timeoutMs = 30000,
): Promise<ArrayBuffer> {
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
  if (!response.ok) {
    throw new Error(`Download of ${url} returned ${response.status}`)
  }
  return response.arrayBuffer()
}
