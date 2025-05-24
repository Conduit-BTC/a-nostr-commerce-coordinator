import type { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk'

export const EventNames = {
  NOSTR_DM_RECEIVED: 'nostr.dm.received',
  ORDER_REQUEST_RECEIVED: 'order.request.received',
  ORDER_CREATED: 'order.created'
} as const

export type NCCEventName = (typeof EventNames)[keyof typeof EventNames]

export type NCCEventPayloads = {
  [EventNames.NOSTR_DM_RECEIVED]: { event: NDKEvent; rumor: NostrEvent }
  [EventNames.ORDER_REQUEST_RECEIVED]: {
    ndkEvent: NDKEvent
    orderEvent: NostrEvent
  }
  [EventNames.ORDER_CREATED]: { orderId: string }
}
