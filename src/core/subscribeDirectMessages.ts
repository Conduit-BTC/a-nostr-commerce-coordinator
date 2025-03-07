import getDb from "@/services/dbService";
import { getNdk } from "@/services/ndkService";
import { NostrEventQueue, QUEUE_EVENT_STATUS, type QueueEvent } from "@/services/nostrEventQueue";
import { NDKEvent, NDKPrivateKeySigner, NDKUser } from "@nostr-dev-kit/ndk";
import processOrder from "./checkout/processOrder";
import { IGNORED_EVENTS_DB_NAME, merchantMessagesFilter, ORDER_EVENTS_DB_NAME } from "@/utils/constants";
import { validateOrder } from "nostr-commerce-schema"

export enum ReceivedDirectMessageType {
    ORDER_CREATION = "order_creation",
    ORDER_UPDATE = "order_update",
}

const pendingDirectMessageQueue = new NostrEventQueue(directMessageQueueEventHandler);
const failedOrdersQueue = new NostrEventQueue(failedOrderQueueEventHandler, QUEUE_EVENT_STATUS.FAILED);

const orderDb = getDb().openDB({ name: ORDER_EVENTS_DB_NAME });
const ignoredEventsDb = getDb().openDB({ name: IGNORED_EVENTS_DB_NAME });

const pubkey = process.env.PUBKEY
const privkey = process.env.PRIVKEY
const signer = new NDKPrivateKeySigner(privkey);

const ndk = await getNdk();

export default async function subscribeDirectMessages() {
    console.log(`[subscribeDirectMessages]: Listening to Relay Pool for NIP-17 DMs addressed to ${pubkey}...`)

    // Set up subscription filter for NIP-17 DMs
    const filter = merchantMessagesFilter;

    const subscription = ndk.subscribe(filter, { closeOnEose: false })

    subscription.on('event', async (event: NDKEvent) => {
        console.log(`[subscribeDirectMessages]: Received NIP-17 encrypted message: ${event.id}`)
        // When the subscription starts, it will fetch all NIP-17 events for the Merchant npub across the Relay Pool, check them against a list of known irrelevant event IDs, as well as a list of already-processed orders. If the event ID is unique, then it will be added to the queue for processing.

        // TODO: Index as an array of IDs to check against?
        // TODO: Also index an array of fulfilled Order IDs to check against?

        const ignored = ignoredEventsDb.get(`nostr-ignored-event:${event.id}`);
        ignoredEventsDb.getKeys().forEach(key => console.log(key))
        if (ignored) return; // If event has been encountered before, but isn't an actual order, skip processing

        const order = orderDb.get(`nostr-order-event:${event.id}`);
        if (order) return; // If event already exists in the database, skip processing

        console.log(`[subscribeDirectMessages]: Adding direct message to queue: ${event.id}`)
        const serializedEvent = event.rawEvent()
        pendingDirectMessageQueue.push(serializedEvent);
    })
}

async function directMessageQueueEventHandler(queueEvent: QueueEvent) {
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

async function failedOrderQueueEventHandler() { }

function getReceivedDirectMessageType(event: NDKEvent): ReceivedDirectMessageType {
    const typeTag = event.tags.find(tag => tag[0] === "type");
    if (!typeTag) return ReceivedDirectMessageType.ORDER_CREATION;

    return typeTag[1] as ReceivedDirectMessageType;
}
