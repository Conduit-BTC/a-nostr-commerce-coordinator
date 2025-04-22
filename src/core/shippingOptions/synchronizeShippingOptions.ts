import { merchantShippingOptionsFilter, pubkey } from "@/utils/constants";
import getDb from "@/services/dbService";
import { getHomeRelaySet, getNdk, getRelayPool } from "@/services/ndkService";
import { type NDKEvent } from "@nostr-dev-kit/ndk";
import { DB_NAME } from "@/types/enums";
import { ProductListingUtils, ShippingOptionUtils, type ProductListing, type ShippingOption } from "nostr-commerce-schema";

export default async function synchronizeShippingOptions() {
    // TODO: We're currently en-masse fetching all ShippingOptions, but instead we want to fetch all ShippingOption events specifically referenced on the ProductListings stored in the ProductDB.

    console.log("[synchronizeShippingOptions]: Synchronizing shipping options...");

    const filter = merchantShippingOptionsFilter;

    const ndk = await getNdk();

    const homeRelaySet = await getHomeRelaySet();
    const relayPool = await getRelayPool();

    const productsDb = getDb().openDB({ name: DB_NAME.PRODUCTS });
    const shippingOptionsDb = getDb().openDB({ name: DB_NAME.SHIPPING_OPTIONS })

    console.log("[synchronizeShippingOptions]: Clearing out the shipping option events database...");
    shippingOptionsDb.clearSync(); // Clear out the DB, get ready for a fresh sync
    console.log("[synchronizeShippingOptions]: Shipping option events database cleared");

    const referenceStrings = [
        ...productsDb
            .getRange()
            .flatMap(({ value }: { value: ProductListing }) =>
                ProductListingUtils.getProductShippingOptions(value).map(({ reference }) => reference)
            )
    ];

    referenceStrings.forEach(async (ref: string) => {
        const id = ref.split(":")[2];
        if (!id) {
            console.error("[synchronizeShippingOptions]: Malformed ShippingOption: ", ref);
            return
        };
        const event = await ProductListingUtils.fetchShippingOptionEvent(id, pubkey!, ndk);
        if (event) await shippingOptionsDb.put(`nostr-shipping-options-event:${event.rawEvent().id}`, event.rawEvent());
    })

    console.log("[synchronizeShippingOptions]: Initial shipping options sync complete!");
}
