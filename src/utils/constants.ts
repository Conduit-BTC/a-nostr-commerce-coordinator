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

export const ORDER_STATUS = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PROCESSING: "processing",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
};

export const PAYMENT_STATUS = {
    REQUESTED: "requested",
    PARTIAL: "partial",
    PAID: "paid",
    EXPIRED: "expired",
    ERROR: "error",
};

export const FULFILLMENT_STATUS = {
    PROCESSING: "processing",
    SHIPPED: "shipped",
    DELIVERED: "delivered",
    EXCEPTION: "exception",
};

export const PAYMENT_TYPE = {
    LIGHTNING_BTC: "lightning_btc",
    ON_CHAIN_BTC: "on_chain_btc",
    CASHU: "cashu",
};

export const CHECKOUT_ERROR = {
    PRODUCT_MISSING: "product_missing",
    INSUFFICIENT_STOCK: "insufficient_stock",
};

export const INVOICE_STATUS = {
    PAID: "PAID",
    PENDING: "PENDING",
    EXPIRED: "EXPIRED",
};

export const NIP17_KIND = {
    MESSAGE: 14,
    ORDER_PROCESSING: 16,
    RECEIPT: 17,
};

export const ORDER_MESSAGE_TYPE = {
    CREATION: "1",
    PAYMENT_REQUEST: "2",
    STATUS_UPDATE: "3",
    SHIPPING_UPDATE: "4",
};

export const QUEUE_NAME = {
    DIRECT_MESSAGES: "direct-messages-queue",
    ORDERS: "orders",
};

export const DB_NAME = {
    PRODUCTS: "products-db",
    SHIPPING_OPTIONS: "shipping-options-db",
    PROCESSING_ORDERS: "processing-orders-db",
    PROCESSING_ORDERS_INVOICE_ID_INDEX: "processing-orders-invoice-id-index",
    SUCCESSFUL_ORDERS: "successful-orders-db",
    FAILED_ORDERS: "failed-orders-db",
    IGNORED_EVENTS: "ignored-events-db",
    MERCHANT_SETTINGS: "merchant-settings-db",
};

export const SIZE_UNIT = {
    CENTIMETER: "centimeter",
    INCH: "inch",
};

export const WEIGHT_UNIT = {
    KILO: "kg",
    OUNCE: "oz",
};
