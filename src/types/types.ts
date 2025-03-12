import { type ProductListing, type Order } from "nostr-commerce-schema";
import type { CHECKOUT_ERROR, PAYMENT_STATUS, PAYMENT_TYPE } from "./enums";

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

export type TransactionProduct = {
    success: boolean,
    product?: ProductListing,
    quantity?: number,
    pricePerItem?: {
        amount: string;
        currency: string;
        frequency?: string;
    },
    error?: CHECKOUT_ERROR,
    message?: string,
}

export type OrderItem = {
    productRef: string;
    quantity: number;
}

export type LightningPaymentDetails = {
    invoiceId: string;
    lightningInvoice: string;
}

export type Payment = {
    amount: number;
    currency: string;
    type: PAYMENT_TYPE;
    details: LightningPaymentDetails
    status: PAYMENT_STATUS;

    error?: string;
    paymentTimestamp?: number;
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
    payment?: Payment;
};

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

export type ReceiptArgs = {
    recipient: string;
    orderId: string;
    lnInvoice: string;
    lnPaymentHash: string;
};


export type PaymentRequestArgs = {
    recipient: string;
    orderId: string;
    amount: string;
    lnInvoice: string;
}
