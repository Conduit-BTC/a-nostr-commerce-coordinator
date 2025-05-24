import { NDKEvent } from '@nostr-dev-kit/ndk'

export function createMockNostrEvent(
  partial: Partial<NDKEvent> = {}
): NDKEvent {
  const mock = new NDKEvent() as NDKEvent

  // Fill in minimal valid fields for what your code actually uses
  Object.assign(mock, {
    id: 'mock-id',
    kind: 4,
    pubkey: 'mock-pubkey',
    content: 'mock-content',
    created_at: Date.now(),
    sig: 'mock-sig',
    tags: [],
    ...partial
  })

  return mock
}

export function createMockOrderEvent() {}
