import { describe, it, expect, afterEach } from "bun:test";
import { EventBus } from "@/events/NCCEventBus";
import { EventNames } from "@/events/NCCEvents";

afterEach(() => {
  EventBus.clear();
});

describe("EventBus", () => {
  it("should call listeners when an event is emitted", () => {
    let called = false;

    EventBus.on(EventNames.ORDER_CREATED, ({ orderId }) => {
      expect(orderId).toBe("abc123");
      called = true;
    });

    EventBus.emit(EventNames.ORDER_CREATED, { orderId: "abc123" });

    expect(called).toBe(true);
  });

  it("should support multiple listeners per event", () => {
    let count = 0;

    EventBus.on(EventNames.ORDER_CREATED, () => count++);
    EventBus.on(EventNames.ORDER_CREATED, () => count++);

    EventBus.emit(EventNames.ORDER_CREATED, { orderId: "xyz" });

    expect(count).toBe(2);
  });
});
