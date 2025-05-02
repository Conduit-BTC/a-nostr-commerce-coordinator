export const ignoredEventIds = new Set<string>()

export function shouldIgnoreEvent(eventId: string): boolean {
  return ignoredEventIds.has(eventId)
}
