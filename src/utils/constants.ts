import type { NDKFilter, NDKKind } from '@nostr-dev-kit/ndk'

export const DEFAULT_RELAYS: string[] = process.env.RELAYS
  ? process.env.RELAYS.split(',').map((s) => s.trim())
  : ['wss://relay.conduit.market']

export const pubkey = process.env.PUBKEY

export const merchantProductsFilter: NDKFilter = {
  kinds: [30402 as NDKKind],
  authors: [pubkey!]
}

export const merchantShippingOptionsFilter: NDKFilter = {
  kinds: [30402 as NDKKind],
  authors: [pubkey!]
}

export const getMerchantSpecificProductFilter = (
  productId: string
): NDKFilter => ({
  kinds: [30402 as NDKKind],
  authors: [pubkey!],
  '#d': [productId]
})

export const merchantMessagesFilter: NDKFilter = {
  kinds: [1059 as NDKKind],
  '#p': [pubkey!]
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

export const PAYMENT_STATUS = {
  REQUESTED: 'requested',
  PARTIAL: 'partial',
  PAID: 'paid',
  EXPIRED: 'expired',
  ERROR: 'error'
} as const

export const FULFILLMENT_STATUS = {
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  EXCEPTION: 'exception'
} as const

export const PAYMENT_TYPE = {
  LIGHTNING_BTC: 'lightning_btc',
  ON_CHAIN_BTC: 'on_chain_btc',
  CASHU: 'cashu'
} as const

export const CHECKOUT_ERROR = {
  PRODUCT_MISSING: 'product_missing',
  INSUFFICIENT_STOCK: 'insufficient_stock'
} as const

export const INVOICE_STATUS = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  EXPIRED: 'EXPIRED'
} as const

export const NIP17_KIND = {
  MESSAGE: 14,
  ORDER_PROCESSING: 16,
  RECEIPT: 17
} as const

export const ORDER_MESSAGE_TYPE = {
  CREATION: '1',
  PAYMENT_REQUEST: '2',
  STATUS_UPDATE: '3',
  SHIPPING_UPDATE: '4'
} as const

export const QUEUE_NAME = {
  DIRECT_MESSAGES: 'direct-messages-queue',
  ORDERS: 'orders'
} as const

export const DB_NAME = {
  PRODUCTS: 'products-db',
  SHIPPING_OPTIONS: 'shipping-options-db',
  PROCESSING_ORDERS: 'processing-orders-db',
  PROCESSING_ORDERS_INVOICE_ID_INDEX: 'processing-orders-invoice-id-index',
  SUCCESSFUL_ORDERS: 'successful-orders-db',
  FAILED_ORDERS: 'failed-orders-db',
  IGNORED_EVENTS: 'ignored-events-db',
  SETTINGS: 'merchant-settings-db'
} as const

export const SIZE_UNIT = {
  CENTIMETER: 'cm',
  INCH: 'in'
} as const

export const WEIGHT_UNIT = {
  KILO: 'kg',
  OUNCE: 'oz'
} as const

export const MERCHANT_SETTING = {
  ZIP_CODE: 'merchant_zip_code'
} as const
