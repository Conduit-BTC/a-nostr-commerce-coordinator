import getDb from "@/services/dbService";
import { PRODUCT_EVENTS_DB_NAME } from "@/utils/constants";
import type { ProductListing } from "nostr-commerce-schema";
import fetchProductFromRelaySet from "./fetchProductFromRelaySet";
import { getHomeRelaySet, getRelayPool } from "@/services/ndkService";

/*
    * Attempts to retrieve a single Product from the DB, fails over to the HomeRelay, finally to the RelayPool.
*/
export async function getProduct(productId: string): Promise<ProductListing | null> {
    const productDb = getDb().openDB({ name: PRODUCT_EVENTS_DB_NAME });
    const productFromDb = await productDb.get(`nostr-product-event:${productId}`);
    if (productFromDb) return productFromDb as ProductListing;

    const productFromHomeRelay = await fetchProductFromRelaySet(await getHomeRelaySet(), productId);
    if (productFromHomeRelay) return productFromHomeRelay;

    const productFromRelayPool = await fetchProductFromRelaySet(await getRelayPool(), productId);
    if (productFromRelayPool) return productFromRelayPool;

    return null;
}
