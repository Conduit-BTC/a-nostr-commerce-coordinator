import { DEFAULT_RELAYS, merchantProductsFilter, PRODUCT_EVENTS_DB_NAME } from "@/utils/constants";
import getDb from "@/services/dbService";
import { getHomeRelay, getHomeRelaySet, getNdk, getRelayPool } from "@/services/ndkService";
import { NDKRelay, NDKRelaySet, type NDKEvent, type NDKFilter, type NDKKind } from "@nostr-dev-kit/ndk";

export default async function synchronizeProducts() {
    console.log("[synchronizeProducts]: Synchronizing products...");

    const pubkey = process.env.PUBKEY;

    const filter = merchantProductsFilter;

    const ndk = await getNdk();

    const homeRelaySet = await getHomeRelaySet();
    const relayPool = await getRelayPool();

    const productsDb = getDb().openDB({ name: PRODUCT_EVENTS_DB_NAME });

    console.log("[synchronizeProducts]: Clearing out the product events database...");
    productsDb.clearSync(); // Clear out the DB, get ready for a fresh sync
    console.log("[synchronizeProducts]: Product events database cleared");

    const homeRelaySubscription = ndk.subscribe(filter, { closeOnEose: false }, homeRelaySet);

    homeRelaySubscription.on('event', async (event: NDKEvent) => {
        // This subscription stays open for the lifetime of the application
        console.log(`[synchronizeProducts]: Received Product event from HomeRelay: ${event.id}`)

        const product = event.rawEvent();

        const dTag = product.tags.find(tag => tag[0] === "d") // Constant Product ID

        if (!dTag || !dTag[1]) {
            console.error(`[synchronizeProducts]: Product event ${product.id} missing d tag`);
            return;
        }

        const productId = dTag[1];

        // This is simply mirroring the home relay event to the local database, then broadcasting it out to the relay pool
        console.log("[synchronizeProducts]: Storing product event in local database...");
        await productsDb.put(`nostr-product-event:${productId}`, product);
        console.log("[synchronizeProducts]: Product event stored in local database");

        console.log(await productsDb.get(`nostr-product-event:${productId}`))

        if (relayPool.size === 0) {
            console.warn("[synchronizeProducts]: WARN: No relays in relay pool");
            return;
        }

        console.log("[synchronizeProducts]: Broadcasting product event to relay pool...");
        relayPool.relays.forEach(relay => {
            console.log(`[synchronizeProducts]: Broadcasting product event to relay: ${relay.url}`);
            relay.publish(event);
        })
        console.log("[synchronizeProducts]: Product event broadcasted to relay pool");
    })

    await new Promise<void>((resolve) => {
        homeRelaySubscription.on("eose", () => {
            console.log("[synchronizeProducts]: All events from HomeRelay received. Finishing up...");
            homeRelaySubscription.off("eose", () => { });
            resolve();
        })
    })

    await new Promise(resolve => setTimeout(resolve, 1000)); // Arbitrary timeout to complete the sync

    console.log("[synchronizeProducts]: Initial product sync complete!");
}
