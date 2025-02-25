import getDb from "@/utils/dbService";
import { getNdk } from "@/utils/ndkService";
import { NostrEventQueue, type QueueEvent } from "@/utils/nostrEventQueue";
import { validateOrderEvent } from "@/utils/zod/nostrOrderSchema";
import { NDKEvent, NDKPrivateKeySigner, NDKUser, type NDKFilter, type NDKKind } from "@nostr-dev-kit/ndk";

enum PAYMENT_STATUS {
    REQUESTED,
    PARTIAL,
    PAID,
    EXPIRED,
    ERROR
}

enum FULFILLMENT_STATUS {
    PROCESSING,
    COMPLETE,
    ERROR
}

const testOrder = {
    paymentStatus: PAYMENT_STATUS.PAID,
    fulfillmentStatus: FULFILLMENT_STATUS.COMPLETE
}

function serializeNDKEvent(event: NDKEvent) {
    return {
        id: event.id,
        pubkey: event.pubkey,
        created_at: event.created_at,
        kind: event.kind,
        content: event.content,
        tags: event.tags,
        sig: event.sig
    };
}

export default async function subscribeOrders() {
    console.log("[subscribeOrders]: Subscribing to orders...");

    const queue = new NostrEventQueue();

    const relayUrl = 'ws://localhost:7777'
    const pubkey = process.env.PUBKEY
    const privkey = process.env.PRIVKEY

    if (!pubkey || !privkey) {
        console.error(`[subscribeOrders]: PUBKEY or PRIVKEY not found in .env`)
        return
    }

    const ndk = await getNdk();

    console.log(`[subscribeOrders]: Listening to ${relayUrl} for NIP-17 DMs addressed to ${pubkey}`)

    // Set up subscription filter for NIP-17 DMs
    const filter: NDKFilter = {
        kinds: [1059 as NDKKind],
        '#p': [pubkey]
    }

    // Subscribe to events
    const subscription = ndk.subscribe(filter, { closeOnEose: false })
    const signer = new NDKPrivateKeySigner(privkey);

    subscription.on('event', async (event: NDKEvent) => {
        console.log(`[subscribeOrders]: Received event: ${event.id}`)
        // When the subscription starts, it will fetch all NIP-17 events for the Merchant npub across the Relay Pool, check them against a list of known irrelevant event IDs, as well as a list of already-processed orders. If the event ID is unique, then it will be added to the queue for processing.

        // TODO: Add a table of non-Order NIP-17 events to ignore early; currently only Order events are stored, meaning a whole load of repeated validation takes place for non-Order events
        // TODO: Index as an array of IDs to check against.
        // TODO: Also index an array of fulfilled Order IDs,

        const db = getDb();
        const order = db.get(`nostr-order-event:${event.id}`);

        if (order) return; // If event already exists in the database, skip processing

        console.log(`[subscribeOrders]: Adding event to queue: ${event.id}`)
        const serializedEvent = serializeNDKEvent(event);
        queue.push(serializedEvent);
    })

    queue.on('processEvent', async (queueEvent: QueueEvent) => {
        // Events added to the queue haven't been encountered by the Coordinator before. If they are not valid orders, they will be added to the ignore list. Otherwise, they will be processed.
        const event = queueEvent.data;

        try {
            const seal: string = await signer.decrypt(new NDKUser({ pubkey: event.pubkey }), event.content)
            const sealJson = JSON.parse(seal)
            const rumor: string = await signer.decrypt(new NDKUser({ pubkey: sealJson.pubkey }), sealJson.content)
            const rumorJson: NDKEvent = JSON.parse(rumor)
            const order = validateOrderEvent(rumorJson)

            // console.log(">>>>>> Received order event: ", rumorJson)

            if (!order.success) {
                queue.confirmProcessed(queueEvent.id); // We've determined this is not a valid order event, so we can clear it from the queue
                return;
            }

            // TODO: Process the order
            const processOrderResult = await processOrder({ orderEvent: order.data, orderNdkEvent: serializeNDKEvent(event) as NDKEvent })

            if (!processOrderResult?.success) {
                console.error(`[subscribeOrders]: Failed to process order event: ${processOrderResult.message}`)
                // TODO: Add to a special queue for failed events
                queue.requeueEvent(queueEvent.id)
                return;
            }
            else {
                console.info(`[subscribeOrders]: Order processed: ${event.id}`)
                queue.confirmProcessed(queueEvent.id)
                return;
            }
        } catch (error) {
            console.error(`[subscribeOrders]: Failed to process order event: ${error}`)

            queue.requeueEvent(queueEvent.id)
            return;
        }
    })
}
