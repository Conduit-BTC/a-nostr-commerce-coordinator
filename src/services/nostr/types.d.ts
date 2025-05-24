// src/types/nostr-events.d.ts
import type {
  NDK,
  NDKEvent,
  NDKFilter,
  NDKKind as BaseNDKKind,
  NDKSubscription,
  NDKSubscriptionOptions
} from '@nostr-dev-kit/ndk'

/**  GammaMarkets kind extensions */
const ExtendedNDKKind = {
  OrderCommunication: 16,
  PaymentReceipt: 17,
  ProductListing: 30402,
  ProductCollection: 30405,
  ProductReview: 31555,
  ShippingOptions: 30406
} as const

export {}

declare global {
  type NDKKind = BaseNDKKind | ExtendedNDKKind

  interface NEFilter extends NDKFilter {}
  interface NESubscriptionOptions extends NDKSubscriptionOptions {}

  type NEEventMap = {
    event: (event: NDKEvent) => void
    eose: (sub: NDKSubscription) => void
    close: (sub: NDKSubscription) => void
  }

  type NESubscriptionEvent = keyof NEEventMap
  type NESubscriptionListener<T extends NESubscriptionEvent> = NEEventMap[T]
}
