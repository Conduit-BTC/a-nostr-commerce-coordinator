import { type ProductListing, type Order, type ShippingOption } from "nostr-commerce-schema";
import { CHECKOUT_ERROR, DB_NAME, FULFILLMENT_STATUS, INVOICE_STATUS, MERCHANT_SETTING, NIP17_KIND, ORDER_MESSAGE_TYPE, ORDER_STATUS, PAYMENT_STATUS, PAYMENT_TYPE, QUEUE_NAME, SIZE_UNIT, WEIGHT_UNIT } from "@/utils/constants"

type ValueOf<T> = T[keyof T];

export type ORDER_STATUS = ValueOf<typeof ORDER_STATUS>;
export type PAYMENT_STATUS = ValueOf<typeof PAYMENT_STATUS>;
export type FULFILLMENT_STATUS = ValueOf<typeof FULFILLMENT_STATUS>;
export type PAYMENT_TYPE = ValueOf<typeof PAYMENT_TYPE>;
export type CHECKOUT_ERROR = ValueOf<typeof CHECKOUT_ERROR>;
export type INVOICE_STATUS = ValueOf<typeof INVOICE_STATUS>;
export type NIP17_KIND = ValueOf<typeof NIP17_KIND>;
export type ORDER_MESSAGE_TYPE = ValueOf<typeof ORDER_MESSAGE_TYPE>;
export type QUEUE_NAME = ValueOf<typeof QUEUE_NAME>;
export type DB_NAME = ValueOf<typeof DB_NAME>;
export type SIZE_UNIT = ValueOf<typeof SIZE_UNIT>;
export type WEIGHT_UNIT = ValueOf<typeof WEIGHT_UNIT>;
export type MERCHANT_SETTING = ValueOf<typeof MERCHANT_SETTING>;

export type MerchantSettings = {
    packageSpecs: MerchantPackageSpec[]
}

// Defines the specs for packages the Merchant is capable of sending to Customer
export type MerchantPackageSpec = {
    sizeUnit: SIZE_UNIT,
    length: number,
    width: number,
    height: number,
    weightUnit?: WEIGHT_UNIT,
    maxWeight?: number
}

export type Transaction = {
    orderId: string;
    items: TransactionProduct[];
    event: Order;
    customerPubkey: string;
    totalPrice: {
        amount: number;
        currency: string;
    },
    timeline: {
        created_at: number;
        paid_at?: number;
        shipped_at?: number;
        delivered_at?: number;
        cancelled_at?: number;
    }
    payment?: Payment;
    shipping?: TransactionShippingInformation;
};

export type TransactionProduct = {
    success: boolean,
    product?: ProductListing,
    quantity?: number,
    dimensions?: {
        sizeUnit: SIZE_UNIT,
        weightUnit: WEIGHT_UNIT,
        length?: number,
        width?: number,
        height?: number,
        weight?: number
    },
    pricePerItem?: {
        amount: string;
        currency: string;
        frequency?: string;
    },
    error?: CHECKOUT_ERROR,
    message?: string,
}

export type TransactionShippingInformation = {
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    address2?: string;
    email?: string;
    phone?: string;
}

export type Package = {
    weight: any;
    itemCount: number;
    units: string;
    length: number;
    width: number;
    height: number;
}

export type Payment = {
    amount: number;
    currency: string;
    type: PAYMENT_TYPE;
    details: LightningPaymentDetails
    status: PAYMENT_STATUS;

    error?: string;
}

export type LightningPaymentDetails = {
    invoiceId: string;
    lightningInvoice: string;
}

export type OrderItem = {
    productRef: string;
    quantity: number;
}

export type ReceiptArgs = {
    recipient: string;
    orderId: string;
    amount: string;
    lnInvoice: string;
    lnPaymentHash: string;
};

export type PaymentRequestArgs = {
    recipient: string;
    orderId: string;
    amount: string;
    lnInvoice: string;
}

export type ShippingCostQuotePayload = {
    originZIPCode: string | undefined;
    destinationZIPCode: string;
    weight: number;
    length: any;
    width: any;
    height: any;
    mailClasses: string[];
    priceType: string;
}

// Responses

export type PerformTransactionPipelineResponse = {
    success: boolean,
    messageToCustomer: string,
    transaction?: Transaction,
}

export type ProcessOrderResponse = {
    success: boolean;
    error?: any;
    messageToCustomer?: string;
    transaction?: Transaction;
}

export type CreateTransactionResponse = {
    success: boolean;
    transaction?: Transaction;
    messageToCustomer?: string;
}

export type CreateInvoiceResponse = {
    success: boolean;
    message?: string;
    lightningInvoice?: string;
    invoiceId?: string;
}

export type StrikeQuoteResponse = {
    success: boolean;
    message?: string;
    strikeResponseData?: any;
    lightningInvoice?: string;
}

export type StrikeBaseInvoiceResponse = {
    success: boolean;
    message?: string;
    invoiceId?: string;
}
