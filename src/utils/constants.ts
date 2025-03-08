import type { NDKFilter, NDKKind } from "@nostr-dev-kit/ndk";

export const DEFAULT_RELAYS = [
    "ws://localhost:7777"
];

export enum DB_NAME {
    PRODUCTS = "products-db",
    PROCESSING_ORDERS = "processing-orders-db",
    SUCCESSFUL_ORDERS = "successful-orders-db",
    FAILED_ORDERS = "failed-orders-db",
    IGNORED_EVENTS = "ignored-events-db",
}

const pubkey = process.env.PUBKEY;

export const merchantProductsFilter: NDKFilter = {
    kinds: [30402 as NDKKind],
    authors: [pubkey!]
}

export const getMerchantSpecificProductFilter = (productId: string): NDKFilter => ({
    kinds: [30402 as NDKKind],
    authors: [pubkey!],
    '#d': [productId]
})

export const merchantMessagesFilter: NDKFilter = {
    kinds: [1059 as NDKKind],
    '#p': [pubkey!]
}

export enum QUEUE_NAME {
    DIRECT_MESSAGES = "direct-messages-queue",
    ORDERS = "orders",
}
