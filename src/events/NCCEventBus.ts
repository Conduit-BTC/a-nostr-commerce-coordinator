import type { NCCEventName, NCCEventPayloads } from "./NCCEvents";

export class NCCEventBus {
  private listeners = new Map<NCCEventName, Set<(payload: any) => void>>();

  emit<K extends NCCEventName>(event: K, payload: NCCEventPayloads[K]) {
    this.listeners.get(event)?.forEach((fn) => {
      (fn as (payload: NCCEventPayloads[K]) => void)(payload);
    });
  }

  on<K extends NCCEventName>(
    event: K,
    fn: (payload: NCCEventPayloads[K]) => void
  ): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(fn as (payload: any) => void);
    this.listeners.set(event, set);
    return () => this.off(event, fn);
  }

  off<K extends NCCEventName>(
    event: K,
    fn: (payload: NCCEventPayloads[K]) => void
  ) {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(fn as (payload: any) => void);
    if (set.size === 0) this.listeners.delete(event);
  }

  clear<K extends NCCEventName>(event?: K) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

export const EventBus = new NCCEventBus();
