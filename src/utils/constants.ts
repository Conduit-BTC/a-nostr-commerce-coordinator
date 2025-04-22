import type { NDKFilter, NDKKind } from "@nostr-dev-kit/ndk";

export const DEFAULT_RELAYS = [
    "ws://localhost:7777"
];

export const pubkey = process.env.PUBKEY;

export const merchantProductsFilter: NDKFilter = {
    kinds: [30402 as NDKKind],
    authors: [pubkey!]
}

export const merchantShippingOptionsFilter: NDKFilter = {
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

export const invoiceWebhookDetails = {
    port: 3333,
    path: "/webhook/invoice",
    method: "POST"
}
