export enum ORDER_STATUS {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PROCESSING = "processing",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
}

export enum PAYMENT_STATUS {
    REQUESTED,
    PARTIAL,
    PAID,
    EXPIRED,
    ERROR
}

export enum FULFILLMENT_STATUS {
    PROCESSING = "processing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    EXCEPTION = "exception",
}

export enum PAYMENT_TYPE {
    LIGHTNING_BTC,
    ON_CHAIN_BTC,
    CASHU
}

export enum CHECKOUT_ERROR {
    PRODUCT_MISSING,
    INSUFFICIENT_STOCK,
}

export enum INVOICE_STATUS {
    PAID = 'PAID',
    PENDING = 'PENDING',
    EXPIRED = 'EXPIRED',
}

export enum NIP17_KIND {
    MESSAGE = 14,
    ORDER_PROCESSING = 16,
    RECEIPT = 17,
}

export enum ORDER_MESSAGE_TYPE {
    CREATION = "1",
    PAYMENT_REQUEST = "2",
    STATUS_UPDATE = "3",
    SHIPPING_UPDATE = "4",
}

export enum QUEUE_NAME {
    DIRECT_MESSAGES = "direct-messages-queue",
    ORDERS = "orders",
}

export enum DB_NAME {
    PRODUCTS = "products-db",
    PROCESSING_ORDERS = "processing-orders-db",
    SUCCESSFUL_ORDERS = "successful-orders-db",
    FAILED_ORDERS = "failed-orders-db",
    IGNORED_EVENTS = "ignored-events-db",
}
