export const pubkey = process.env.PUBKEY
export const privkey = process.env.PRIVKEY

export const Defaults = {
  RELAYS: ['ws://localhost:7777'],
  MERCHANT_SETTINGS: {
    ZIP_CODE: 'merchant_zip_code'
  }
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

export const PAYMENT_STATUS = {
  REQUESTED: 'requested',
  PARTIAL: 'partial',
  PAID: 'paid',
  EXPIRED: 'expired',
  ERROR: 'error'
}

export const FULFILLMENT_STATUS = {
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  EXCEPTION: 'exception'
}

export const PAYMENT_TYPE = {
  LIGHTNING_BTC: 'lightning_btc',
  ON_CHAIN_BTC: 'on_chain_btc',
  CASHU: 'cashu'
}

export const CHECKOUT_ERROR = {
  PRODUCT_MISSING: 'product_missing',
  INSUFFICIENT_STOCK: 'insufficient_stock'
}

export const INVOICE_STATUS = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  EXPIRED: 'EXPIRED'
}

export const NIP17_KIND = {
  MESSAGE: 14,
  ORDER_PROCESSING: 16,
  RECEIPT: 17
}

export const ORDER_MESSAGE_TYPE = {
  CREATION: '1',
  PAYMENT_REQUEST: '2',
  STATUS_UPDATE: '3',
  SHIPPING_UPDATE: '4'
}

export const SIZE_UNIT = {
  CENTIMETER: 'centimeter',
  INCH: 'inch'
}

export const WEIGHT_UNIT = {
  KILO: 'kg',
  OUNCE: 'oz'
}
