// test/NESubscription.test.ts
import { describe, expect, it, spyOn } from "bun:test";
import type { NDKSubscription } from "@nostr-dev-kit/ndk";
import type NDK from "@nostr-dev-kit/ndk";
import { NESubscription } from "./NESubscription";

describe("NESubscription", () => {
  it("subscribes with the provided filter and options", () => {
    const fakeSubscription = {
      on: () => {},
    } as unknown as NDKSubscription;

    const ndk = {
      subscribe: () => fakeSubscription,
    } as unknown as NDK;

    const subscribeSpy = spyOn(ndk, "subscribe");

    const filter = { kinds: [1], authors: ["pubkey"] };
    const options = { closeOnEose: true };

    const sub = new NESubscription({ ndk, filter, options });

    expect(subscribeSpy).toHaveBeenCalledWith(filter, options);
    expect(sub.subscription).toBe(fakeSubscription);
  });

  it("attaches event listeners to the subscription", () => {
    const onSpy = function () {} as unknown as NDKSubscription["on"];
    const subscription = {
      on: onSpy,
    } as unknown as NDKSubscription;

    const onSpyReal = spyOn(subscription, "on");

    const ndk = {
      subscribe: () => subscription,
    } as unknown as NDK;

    const sub = new NESubscription({ ndk, filter: { kinds: [1] } });

    const eventListener = () => {};
    const eoseListener = () => {};

    sub.on("event", eventListener);
    sub.on("eose", eoseListener);

    expect(onSpyReal).toHaveBeenCalledWith("event", eventListener);
    expect(onSpyReal).toHaveBeenCalledWith("eose", eoseListener);
  });
});
