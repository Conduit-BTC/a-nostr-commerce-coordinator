import type NDK from "@nostr-dev-kit/ndk";
import type { NDKEvent, NDKSubscription } from "@nostr-dev-kit/ndk";

export class NESubscription {
  subscription: NDKSubscription;

  constructor({
    ndk,
    filter,
    options,
  }: {
    ndk: NDK;
    filter: NEFilter;
    options?: NESubscriptionOptions;
  }) {
    this.subscription = ndk.subscribe(filter, options);
  }

  on(event: "event", listener: (event: NDKEvent) => void): void;
  on(event: "eose", listener: (sub: NDKSubscription) => void): void;
  on(event: "close", listener: (sub: NDKSubscription) => void): void;

  on(
    event: NESubscriptionEvent,
    listener: NESubscriptionListener<NESubscriptionEvent>
  ) {
    this.subscription.on(event as any, listener as any);
  }
}
