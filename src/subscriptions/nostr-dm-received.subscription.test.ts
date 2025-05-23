import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { EventBus } from "@/events/NCCEventBus";
import { EventNames } from "@/events/NCCEvents";
import NostrDMReceivedSubscription from "@/subscriptions/nostr-dm-received.subscription";
import { createMockNostrEvent } from "@test/mocks/mock-ndk-event";

let consoleLogSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  consoleLogSpy = spyOn(console, "log");
});

afterEach(() => {
  consoleLogSpy.mockReset();
  consoleLogSpy.mockRestore();
});

describe("NostrDMReceivedSubscription", () => {
  it("should register a listener for NOSTR_DM_RECEIVED and log payload", () => {
    const sub = new NostrDMReceivedSubscription();
    sub.subscribe();

    const payload = {
      event: createMockNostrEvent(),
    };

    EventBus.emit(EventNames.NOSTR_DM_RECEIVED, payload);

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("NostrDMReceivedSubscription")
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining(JSON.stringify(payload))
    );
  });

  it("should expose correct static eventNames", () => {
    expect(NostrDMReceivedSubscription.eventNames()).toEqual([
      EventNames.NOSTR_DM_RECEIVED,
    ]);
  });
});
