import type { NDKFilter, NDKKind } from "@nostr-dev-kit/ndk";

export const DEFAULT_RELAYS = [
    "ws://localhost:7777"
];

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
