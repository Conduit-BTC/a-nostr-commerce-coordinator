import getDb from "@/services/dbService";
import { getNdk } from "@/services/ndkService";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { IGNORED_EVENTS_DB_NAME, merchantMessagesFilter, NOSTR_EVENT_QUEUE_NAME, ORDER_EVENTS_DB_NAME } from "@/utils/constants";
import { getNostrEventQueue } from "@/queues";

export default async function subscribeDirectMessages() {
    const pubkey = process.env.PUBKEY

    const orderDb = getDb().openDB({ name: ORDER_EVENTS_DB_NAME });
    const ignoredEventsDb = getDb().openDB({ name: IGNORED_EVENTS_DB_NAME });

    const ndk = await getNdk();

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
        getNostrEventQueue(NOSTR_EVENT_QUEUE_NAME.PENDING_DIRECT_MESSAGES).push(serializedEvent);
    })
}
