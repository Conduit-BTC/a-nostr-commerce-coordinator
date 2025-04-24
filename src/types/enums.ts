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
    PRODUCTS = "products-db", // key: productId, value: ProductListing
    SHIPPING_OPTIONS = "shipping-options-db", // key: shippingOptionId, value: ShippingOption
    PROCESSING_ORDERS = "processing-orders-db", // key: orderId, value: Transaction
    PROCESSING_ORDERS_INVOICE_ID_INDEX = "processing-orders-invoice-id-index", // key: invoiceId, value: orderId
    SUCCESSFUL_ORDERS = "successful-orders-db", // key: orderId, value: Transaction
    FAILED_ORDERS = "failed-orders-db", // key: orderId, value: Transaction
    IGNORED_EVENTS = "ignored-events-db",   // key: eventId, value: NostrEvent
}

export enum SIZE_UNIT {
    CENTIMETER = 'centimeter',
    INCH = 'inch'
}

export enum WEIGHT_UNIT {
    KILO = 'kg',
    OUNCE = 'oz'
}