import type { NostrEvent } from '@nostr-dev-kit/ndk';
import { EventEmitter } from 'events'

export enum QUEUE_EVENT_STATUS {
    PENDING,
    PROCESSING,
    PROCESSED,
    FAILED
}

export interface QueueEvent {
    id: string;
    data: NostrEvent;
    status: QUEUE_EVENT_STATUS;
    messages?: string[];
}

export const NostrEventQueueRegistry = new Map<string, NostrEventQueue>()

export class NostrEventQueue extends EventEmitter {
    public name: string | null = null;
    private queue: any[] = []
    private inFlightEvents: Map<string, QueueEvent> = new Map();
    private processing: boolean = false
    private defaultStatus: QUEUE_EVENT_STATUS = QUEUE_EVENT_STATUS.PENDING
    private processHandler: (event: QueueEvent) => void

    // TODO: Implement delay between events, a max retry mechanism, and a "failed" queue for events that failed to process

    constructor(name: string, processHandler: (event: QueueEvent) => void, defaultStatus?: QUEUE_EVENT_STATUS) {
        super()
        this.defaultStatus = defaultStatus ?? QUEUE_EVENT_STATUS.PENDING;
        this.processHandler = processHandler;
        NostrEventQueueRegistry.set(name, this)
    }

    push(event: NostrEvent, messages?: any): void {
        const queueEvent: QueueEvent = {
            id: crypto.randomUUID(),
            data: event,
            status: this.defaultStatus,
            messages: messages ?? []
        }
        this.queue.push(queueEvent)
        this.processQueue()
    }


    private processQueue(): void {
        if (this.processing || this.queue.length === 0) return
        this.processing = true
        try {
            while (this.queue.length > 0) {
                const event: QueueEvent = this.queue[0]
                event.status = QUEUE_EVENT_STATUS.PROCESSING
                try {
                    this.inFlightEvents.set(event.id, event)
                    this.queue.shift()
                    this.processHandler(event)
                } catch (error) {
                    console.error(`Error processing event: ${error}`)
                    break
                }
            }
        } finally {
            this.processing = false
        }
        if (this.queue.length > 0) {
            this.processQueue()
        }
    }

    public confirmProcessed(eventId: string): void {
        if (!this.inFlightEvents.delete(eventId)) {
            console.warn(`Attempted to confirm event ${eventId} but it was not found in in-flight events`)
        }
    }

    public requeueEvent(eventId: string): void {
        const event = this.inFlightEvents.get(eventId)
        if (event) {
            event.status = QUEUE_EVENT_STATUS.PENDING
            this.queue.push(event)
            this.inFlightEvents.delete(eventId)
            console.info(`Event ${eventId} requeued`)
            this.processQueue()
        } else {
            console.warn(`Attempted to requeue event ${eventId} but it was not found in in-flight events`)
        }
    }

}
