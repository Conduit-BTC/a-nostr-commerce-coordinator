import type { NDKFilter, NDKKind } from "@nostr-dev-kit/ndk";

export const DEFAULT_RELAYS = [
    "ws://localhost:7777"
];

export const PRODUCT_EVENTS_DB_NAME = "nostr-product-events";
export const ORDER_EVENTS_DB_NAME = "nostr-order-events";
export const IGNORED_EVENTS_DB_NAME = "nostr-ignored-events";

const pubkey = process.env.PUBKEY;

export const merchantProductsFilter: NDKFilter = {
    kinds: [30402 as NDKKind],
    '#p': [pubkey!]
}

export const getMerchantSpecificProductFilter = (productId: string): NDKFilter => ({
    kinds: [30402 as NDKKind],
    '#p': [pubkey!],
    '#d': [productId]
})

export const merchantMessagesFilter: NDKFilter = {
    kinds: [1059 as NDKKind],
    '#p': [pubkey!]
}
