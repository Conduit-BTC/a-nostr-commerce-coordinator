import { getNdk } from "@/services/ndkService";
import { getMerchantSpecificProductFilter } from "@/utils/constants";
import type { NDKRelaySet } from "@nostr-dev-kit/ndk";
import { validateProductListing, type ProductListing } from "nostr-commerce-schema";

export default async function fetchProductFromRelaySet(relaySet: NDKRelaySet, productId: string, timeoutMs = 1000): Promise<ProductListing | null> {
    console.log(`[fetchProductFromRelaySet]: Fetching ${productId} from relay set...`);
    console.log(`[fetchProductFromRelaySet]: Relay set: ${relaySet.relayUrls}`);

    const ndk = await getNdk();
    const filter = getMerchantSpecificProductFilter(productId);
    const subscription = ndk.subscribe(filter, { closeOnEose: false }, relaySet);

    return new Promise<ProductListing | null>((resolve, reject) => {
        let resolved = false;

        const timeout = setTimeout(() => {
            if (!resolved) {
                console.warn(`[fetchProductFromRelaySet]: Product event for ${productId} timed out`);
                subscription.stop();
                resolve(null);
            }
        }, timeoutMs)

        subscription.on('event', async (event) => {
            if (resolved) return;

            console.log(`[fetchProductFromRelaySet]: Received Product event from RelaySet: ${event.id}`)
            const product = event.rawEvent();

            if (validateProductListing(product)) {
                clearTimeout(timeout);
                resolved = true;
                subscription.stop();
                resolve(product as unknown as ProductListing);
            }
            console.warn(`[fetchProductFromRelaySet]: Product event ${product.id} failed validation`);
            reject();
        });
    })
}
