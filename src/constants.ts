import type { NDKFilter, NDKKind } from '@nostr-dev-kit/ndk'

export const pubkey = process.env.PUBKEY
export const privkey = process.env.PRIVKEY

export const Defaults = {
  RELAYS: ['ws://localhost:7777'],

  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },

  PAYMENT_STATUS: {
    REQUESTED: 'requested',
    PARTIAL: 'partial',
    PAID: 'paid',
    EXPIRED: 'expired',
    ERROR: 'error'
  },

  FULFILLMENT_STATUS: {
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    EXCEPTION: 'exception'
  },

  PAYMENT_TYPE: {
    LIGHTNING_BTC: 'lightning_btc',
    ON_CHAIN_BTC: 'on_chain_btc',
    CASHU: 'cashu'
  },

  CHECKOUT_ERROR: {
    PRODUCT_MISSING: 'product_missing',
    INSUFFICIENT_STOCK: 'insufficient_stock'
  },

  INVOICE_STATUS: {
    PAID: 'PAID',
    PENDING: 'PENDING',
    EXPIRED: 'EXPIRED'
  },

  NIP17_KIND: {
    MESSAGE: 14,
    ORDER_PROCESSING: 16,
    RECEIPT: 17
  },

  ORDER_MESSAGE_TYPE: {
    CREATION: '1',
    PAYMENT_REQUEST: '2',
    STATUS_UPDATE: '3',
    SHIPPING_UPDATE: '4'
  },

  QUEUE_NAME: {
    DIRECT_MESSAGES: 'direct-messages-queue',
    ORDERS: 'orders'
  },

  DB_NAME: {
    PRODUCTS: 'products-db',
    SHIPPING_OPTIONS: 'shipping-options-db',
    PROCESSING_ORDERS: 'processing-orders-db',
    PROCESSING_ORDERS_INVOICE_ID_INDEX: 'processing-orders-invoice-id-index',
    SUCCESSFUL_ORDERS: 'successful-orders-db',
    FAILED_ORDERS: 'failed-orders-db',
    IGNORED_EVENTS: 'ignored-events-db',
    SETTINGS: 'merchant-settings-db'
  },

  SIZE_UNIT: {
    CENTIMETER: 'centimeter',
    INCH: 'inch'
  },

  WEIGHT_UNIT: {
    KILO: 'kg',
    OUNCE: 'oz'
  },

  MERCHANT_SETTING: {
    ZIP_CODE: 'merchant_zip_code'
  }
}
