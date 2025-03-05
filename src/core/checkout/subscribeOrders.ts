import getDb from "@/services/dbService";
import { getNdk } from "@/services/ndkService";
import { NostrEventQueue, QUEUE_EVENT_STATUS, type QueueEvent } from "@/services/nostrEventQueue";
import { NDKEvent, NDKPrivateKeySigner, NDKUser } from "@nostr-dev-kit/ndk";
import processOrder from "./processOrder";
import { IGNORED_EVENTS_DB_NAME, merchantMessagesFilter, ORDER_EVENTS_DB_NAME } from "@/utils/constants";
import { validateOrder } from "nostr-commerce-schema"

const pendingOrdersQueue = new NostrEventQueue(orderQueueEventHandler);
const failedOrdersQueue = new NostrEventQueue(failedOrderQueueEventHandler, QUEUE_EVENT_STATUS.FAILED);

const orderDb = getDb().openDB({ name: ORDER_EVENTS_DB_NAME });
const ignoredEventsDb = getDb().openDB({ name: IGNORED_EVENTS_DB_NAME });

const pubkey = process.env.PUBKEY
const privkey = process.env.PRIVKEY
const signer = new NDKPrivateKeySigner(privkey);

const ndk = await getNdk();

export default async function subscribeOrders() {
    console.log(`[subscribeOrders]: Listening to Relay Pool for NIP-17 DMs addressed to ${pubkey}...`)

    // Set up subscription filter for NIP-17 DMs
    const filter = merchantMessagesFilter;

    const subscription = ndk.subscribe(filter, { closeOnEose: false })

    subscription.on('event', async (event: NDKEvent) => {
        console.log(`[subscribeOrders]: Received NIP-17 encrypted message: ${event.id}`)
        // When the subscription starts, it will fetch all NIP-17 events for the Merchant npub across the Relay Pool, check them against a list of known irrelevant event IDs, as well as a list of already-processed orders. If the event ID is unique, then it will be added to the queue for processing.

        // TODO: Add a table of non-Order NIP-17 events to ignore early; currently only Order events are stored, meaning a whole load of repeated validation takes place for non-Order events
        // TODO: Index as an array of IDs to check against.
        // TODO: Also index an array of fulfilled Order IDs,

        const ignored = ignoredEventsDb.get(`nostr-order-event:${event.id}`);
        ignoredEventsDb.getKeys().forEach(key => console.log(key))
        if (ignored) return; // If event has been encountered before, but isn't an actual order, skip processing

        const order = orderDb.get(`nostr-order-event:${event.id}`);
        if (order) return; // If event already exists in the database, skip processing

        console.log(`[subscribeOrders]: Adding order event to queue: ${event.id}`)
        const serializedEvent = event.rawEvent()
        pendingOrdersQueue.push(serializedEvent);
    })
}

async function orderQueueEventHandler(queueEvent: QueueEvent) {
    // Events added to the queue haven't been encountered by the Coordinator before. If they are not valid orders, they will be added to the ignore list. Otherwise, they will be processed.
    const event = queueEvent.data;
    try {
        console.log("[subscribeOrders]: Processing order event from queue...")
        // NIP-17 Decryption + Validation
        const seal: string = await signer.decrypt(new NDKUser({ pubkey: event.pubkey }), event.content)
        const sealJson = JSON.parse(seal)
        const rumor: string = await signer.decrypt(new NDKUser({ pubkey: sealJson.pubkey }), sealJson.content)
        const rumorJson: NDKEvent = JSON.parse(rumor)
        const order = validateOrder(rumorJson)

        if (!order.success) {
            console.log(`[subscribeOrders]: Order event failed validation: ${order}`)
            // We've determined this is not a valid order event, so we can clear it from the queue and ignore it in the future
            pendingOrdersQueue.confirmProcessed(queueEvent.id);
            // ignoredEventsDb.put(`nostr-order-event:${event.id}`, true)
            return;
        }

        // TODO: Check order-id against all Receipt events, and if it's already been processed, ignore it in the future. An order may make it this far if the database was previously wiped, or some orders have been processed outside of the Coorindator.

        const processOrderResult = await processOrder(order.data)

        if (!processOrderResult?.success) throw new Error(processOrderResult.messageToCustomer)

        pendingOrdersQueue.confirmProcessed(queueEvent.id)
        orderDb.put(`nostr-order-event:${event.id}`, event)

        console.info(`[subscribeOrders]: Order processed: ${event.id}`)
    } catch (error) {
        console.error(`[subscribeOrders]: Failed to process order event: ${error}`)

        pendingOrdersQueue.confirmProcessed(queueEvent.id);
        failedOrdersQueue.push(event)
        return;
    }
}

async function failedOrderQueueEventHandler() { }
