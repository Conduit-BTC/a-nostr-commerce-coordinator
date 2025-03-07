import { type NostrEventQueue, NostrEventQueueRegistry } from "./NostrEventQueue";

export function getNostrEventQueue(key: string): NostrEventQueue {
    const queue = NostrEventQueueRegistry.get(key);
    if (!queue) {
        throw new Error(`No queue found for key: ${key}`);
    }
    return queue;
}
