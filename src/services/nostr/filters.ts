import type { NDKFilter, NDKKind } from '@nostr-dev-kit/ndk'

export const NEFilters = {
  ProductListingFilter({ pubkey }: { pubkey: string }): NDKFilter {
    return {
      kinds: [30402 as NDKKind],
      authors: [pubkey!]
    }
  },
  merchantShippingOptionsFilter({ pubkey }: { pubkey: string }): NDKFilter {
    return {
      kinds: [30402 as NDKKind],
      authors: [pubkey!]
    }
  },
  getMerchantSpecificProductFilter({
    pubkey,
    productId
  }: {
    pubkey: string
    productId: string
  }): NDKFilter {
    return {
      kinds: [30402 as NDKKind],
      authors: [pubkey!],
      '#d': [productId]
    }
  },
  merchantMessagesFilter({ pubkey }: { pubkey: string }): NDKFilter {
    return {
      kinds: [1059 as NDKKind],
      '#p': [pubkey!]
    }
  }
}
