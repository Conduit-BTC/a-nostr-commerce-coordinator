import getDb from "@/services/dbService";
import { validateOrder } from "nostr-commerce-schema";
import processOrder from "@/core/checkout/processOrder";
import { NDKEvent, NDKPrivateKeySigner, NDKUser } from "@nostr-dev-kit/ndk";
import { NostrEventQueueRegistry, type QueueEvent } from "../NostrEventQueue";
import { IGNORED_EVENTS_DB_NAME, NOSTR_EVENT_QUEUE_NAME, ORDER_EVENTS_DB_NAME } from "@/utils/constants";

export enum ReceivedDirectMessageType {
    ORDER_CREATION = "order_creation",
    ORDER_UPDATE = "order_update",
}

const privkey = process.env.PRIVKEY
const signer = new NDKPrivateKeySigner(privkey);

const orderDb = getDb().openDB({ name: ORDER_EVENTS_DB_NAME });
const ignoredEventsDb = getDb().openDB({ name: IGNORED_EVENTS_DB_NAME });

export async function dmQueueEventHandler(queueEvent: QueueEvent) {
    const pendingDirectMessageQueue = NostrEventQueueRegistry.get(NOSTR_EVENT_QUEUE_NAME.PENDING_DIRECT_MESSAGES);
    const failedOrdersQueue = NostrEventQueueRegistry.get(NOSTR_EVENT_QUEUE_NAME.FAILED_ORDERS);

    if (!pendingDirectMessageQueue || !failedOrdersQueue) {
        throw new Error(`[DMQueueEventHandler]: NostrEventQueueRegistry missing required queues.`)
    }

    // Events added to the queue haven't been encountered by the Coordinator before. If they are not Cooridinator-handled message types, they will be added to the ignore list. Otherwise, they will be processed.
    const event = queueEvent.data;
    try {
        console.log("[subscribeDirectMessages]: Processing DM from queue...")
        // NIP-17 Decryption + Validation
        const seal: string = await signer.decrypt(new NDKUser({ pubkey: event.pubkey }), event.content)
        const sealJson = JSON.parse(seal)
        const rumor: string = await signer.decrypt(new NDKUser({ pubkey: sealJson.pubkey }), sealJson.content)
        const rumorJson: NDKEvent = JSON.parse(rumor)

        // TODO: Check rumorJson's kind and tags to determine which kind of event it is, then handle accordingly

        const messageType: ReceivedDirectMessageType = getReceivedDirectMessageType(rumorJson);

        const order = validateOrder(rumorJson)

        if (order.success) {
            // TODO: Check order-id against all Receipt events, and if it's already been processed, ignore it in the future. An order may make it this far if the database was previously wiped, or some orders have been processed outside of the Coorindator.
            const processOrderResult = await processOrder(order.data, event.pubkey)
            if (!processOrderResult?.success) throw new Error(processOrderResult.messageToCustomer)
            pendingDirectMessageQueue.confirmProcessed(queueEvent.id)
            orderDb.put(`nostr-order-event:${event.id}`, event)
            console.info(`[subscribeDirectMessages]: Order processed: ${event.id}`)
            return;
        }

        // We've determined this is not a valid order event. It may be a different type of Coordinator-handled message from the Customer, however.
        // TODO: Push to a different queue
        pendingDirectMessageQueue.confirmProcessed(queueEvent.id);
        // ignoredEventsDb.put(`nostr-ignored-event:${event.id}`, true)

    } catch (error) {
        console.error(`[subscribeDirectMessages]: Failed to process order event: ${error}`)

        pendingDirectMessageQueue.confirmProcessed(queueEvent.id);
        failedOrdersQueue.push(event)
        return;
    }
}

function getReceivedDirectMessageType(event: NDKEvent): ReceivedDirectMessageType {
    const typeTag = event.tags.find(tag => tag[0] === "type");
    if (!typeTag) return ReceivedDirectMessageType.ORDER_CREATION;

    return typeTag[1] as ReceivedDirectMessageType;
}
