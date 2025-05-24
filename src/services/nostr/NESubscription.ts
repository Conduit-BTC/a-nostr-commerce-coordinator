import type { NDKEvent, NDKSubscription } from '@nostr-dev-kit/ndk'
import type { NostrService } from './NostrService'

export class NESubscription {
  subscription: NDKSubscription

  constructor({
    nostrService,
    filter,
    options
  }: {
    nostrService: NostrService
    filter: NEFilter
    options?: NESubscriptionOptions
  }) {
    const ndk = nostrService.getNDK()
    this.subscription = ndk.subscribe(filter, options)
  }

  on(event: 'event', listener: (event: NDKEvent) => void): void
  on(event: 'eose', listener: (sub: NDKSubscription) => void): void
  on(event: 'close', listener: (sub: NDKSubscription) => void): void

  on(
    event: NESubscriptionEvent,
    listener: NESubscriptionListener<NESubscriptionEvent>
  ) {
    this.subscription.on(event as any, listener as any)
  }
}
