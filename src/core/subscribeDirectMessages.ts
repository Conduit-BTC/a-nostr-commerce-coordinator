import { getNdk } from "@/services/ndkService";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { merchantMessagesFilter, QUEUE_NAME } from "@/utils/constants";
import { getQueue } from "@/queues/Queue";
import { shouldIgnoreEvent } from "@/utils/shouldIgnoreEvent";

export default async function subscribeDirectMessages() {
    console.log(`[subscribeDirectMessages]: Listening to Relay Pool for NIP-17 DMs addressed to ${process.env.PUBKEY}...`)

    // Set up subscription filter for NIP-17 DMs
    const filter = merchantMessagesFilter;

    const ndk = await getNdk();
    const subscription = ndk.subscribe(filter, { closeOnEose: false })

    subscription.on('event', async (event: NDKEvent) => {
        console.log(`[subscribeDirectMessages]: Received NIP-17 encrypted message: ${event.id}`)
        // When the subscription starts, it will fetch all NIP-17 events for the Merchant npub across the Relay Pool, check them against a list of known irrelevant event IDs, as well as a list of already-processed orders. If the event ID is unique, then it will be added to the queue for processing.

        console.log(`[subscribeDirectMessages]: Checking if event is explicitly ignored...`)
        if (shouldIgnoreEvent(event.id)) return;

        console.log(`[subscribeDirectMessages]: Adding direct message to queue: ${event.id}`)
        getQueue(QUEUE_NAME.DIRECT_MESSAGES).push(event.rawEvent()); // Handled via dmEventHandler
    })
}
