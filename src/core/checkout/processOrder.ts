import { OrderUtils, ProductListingUtils, type Order, type ProductListing } from "nostr-commerce-schema";
import { getProduct } from "./getProduct";
import { CHECKOUT_ERROR } from "./checkoutErrors";
import { createInvoice, type CreateInvoiceResponse } from "@/interfaces/payment/LightningInterface";
import { sendPaymentRequestMessage } from "@/utils/directMessageUtils";
import { DEBUG_CTRL } from "dev/utils/debugModeControls";

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

type PerformTransactionPipelineResponse = {
    success: boolean,
    messageToCustomer: string,
    transaction?: Transaction,
}

type ProcessOrderResponse = {
    success: boolean;
    error?: any;
    messageToCustomer?: string;
    transaction?: Transaction;
}

type TransactionProduct = {
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

type OrderItem = {
    productRef: string;
    quantity: number;
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
    lightningInvoice?: string;
};

type CreateTransactionResponse = {
    success: boolean;
    transaction?: Transaction;
    messageToCustomer?: string;
}

export default async function processOrder(event: Order, customerPubkey: string): Promise<ProcessOrderResponse> {
    try {
        const performTransactionPipelineResponse = await performTransactionPipeline(event, customerPubkey);
        if (!performTransactionPipelineResponse.success) {
            return {
                success: false,
                messageToCustomer: performTransactionPipelineResponse.messageToCustomer,
            };
        }

        // TODO: Set up a webhook to listen for payment events
        // TODO: When payment is received, mark the Order as "completed" and send a confirmation to the Customer
        // TODO: When payment is received, start the fulfillment process

        return {
            success: true,
            messageToCustomer: "Order successfully processed",
        };
    } catch (error) {
        console.error("Product sync workflow failed:", error);
        return { success: false, messageToCustomer: "Order processing failed. Contact Merchant." };
    }
}

async function performTransactionPipeline(event: Order, customerPubkey: string): Promise<PerformTransactionPipelineResponse> {
    try {
        console.log("[verifyNewOrder]: Verifying new order...");

        // TODO: Shipping steps

        const createTransactionResponse = await createTransaction(event, customerPubkey);
        if (!createTransactionResponse.success) return {
            success: false,
            messageToCustomer: createTransactionResponse.messageToCustomer!,
        };

        const { transaction } = createTransactionResponse;
        const validateTransactionResponse = validateTransaction(transaction!);

        if (!validateTransactionResponse.success) {
            console.error("[verifyNewOrder]: Issue with transaction in ", transaction!.orderId);
            return {
                success: false,
                messageToCustomer: validateTransactionResponse.messageToCustomer!,
            };
        }

        console.log("[verifyNewOrder]: Transaction valid for Order ID:", transaction!.orderId);

        const finalizeTransactionResponse = await finalizeTransaction(transaction!);
        if (!finalizeTransactionResponse.success) {
            console.error("[verifyNewOrder]: Issue with finalizing transaction in ", transaction!.orderId);
            return {
                success: false,
                messageToCustomer: finalizeTransactionResponse.messageToCustomer!,
            };
        }

        console.log("[processOrder]: Transaction complete for ", transaction!.orderId);

        return {
            success: true,
            messageToCustomer: "Order successfully processed",
            transaction,
        };
    } catch (error) {
        console.error("performTransactionPipeline failed:", error);
        return { success: false, messageToCustomer: "We're sorry, something went wrong with the checkout process. We'll contact you shortly to finalize this order." };
    }
}

async function createTransaction(order: Order, customerPubkey: string): Promise<CreateTransactionResponse> {
    const items: OrderItem[] = OrderUtils.getOrderItems(order);
    const { transactionItems, missingItems } = await prepareTransactionItems(items);
    const orderId = OrderUtils.getOrderId(order);

    // Right now, we're failing the order if any Products cannot be located in the database, home relay, or relay pool. Later, we'll gracefully handle this by contacting the Customer to ask if they'd like to proceed without those items.
    if (transactionItems.length === 0 || missingItems.length > 0) {
        console.error(`[verifyNewOrder]: Issue with items in Order ID: ${orderId}`);
        return {
            success: false,
            messageToCustomer: "[Commerce Coordinator Bot]: Sorry, I ran into a problem. I'll contact you shortly to proceed with your order."
        };
    }

    const transaction = { orderId, items: transactionItems, event: order, customerPubkey } as Transaction;
    return { success: true, transaction };
}

async function prepareTransactionItems(orderItems: OrderItem[]): Promise<{ transactionItems: TransactionProduct[], missingItems: TransactionProduct[] }> {
    const itemPromises: Promise<TransactionProduct>[] = orderItems.map(async (item) => {
        let totalPrice = {
            amount: 0.0,
            currency: null,
        }; // TODO: This is brittle at the moment, since it assumes all products are in the same currency. An easy assumption to make, but the protocol allows each Product to have a different currency, so this could cause a problem.

        const productId = OrderUtils.getProductIdFromOrderItem(item);
        const product = await getProduct(productId);

        if (!product) return {
            success: false,
            error: CHECKOUT_ERROR.PRODUCT_MISSING,
            message: `Product with ID ${productId} not found in database, home relay, or relay pool.`,
        } as TransactionProduct;

        return {
            success: true,
            product: product,
            quantity: item.quantity,
            pricePerItem: ProductListingUtils.getProductPrice(product),
        } as TransactionProduct;
    });

    const allItems = await Promise.all(itemPromises);
    const [items, missingItems]: TransactionProduct[][] = allItems.reduce(
        (result: TransactionProduct[][], item: TransactionProduct) => {
            result[item.success ? 0 : 1].push(item);
            return result;
        },
        [[], []]
    );

    return { transactionItems: items, missingItems };
};

function validateTransaction(transaction: Transaction): ProcessOrderResponse {
    const { items } = transaction;

    // Price Check
    // We're only supporting USD for now. This will need to be updated to support multiple currencies.
    const isOnlyUsd = items.every((item) => item.pricePerItem!.currency === "USD");
    if (!isOnlyUsd) return { success: false, messageToCustomer: "Sorry, we only support USD as the base Product price currency at the moment." };

    // Stock Check
    const stockCheckErrors: ProcessOrderResponse[] = [];

    items.some((item) => {
        const stock = ProductListingUtils.getProductStock(item.product!);
        if (!stock) return false;
        if (item.quantity! > stock!) stockCheckErrors.push({
            success: false,
            error: CHECKOUT_ERROR.INSUFFICIENT_STOCK,
            messageToCustomer: `Issue with your order: "${ProductListingUtils.getProductTitle(item.product!)}" has only ${stock} in stock, but you ordered ${item.quantity}. Please update your order and try again.`
        });
        return true;
    });

    if (stockCheckErrors.length > 0) return stockCheckErrors[0];

    return { success: true, messageToCustomer: "Transaction validated." };
}

async function finalizeTransaction(transaction: Transaction): Promise<ProcessOrderResponse> {
    const { items, orderId, customerPubkey } = transaction;

    // We're only supporting USD base currency for now. This was assured in validateTransaction(). This will need to be updated to support multiple currencies.
    const totalPrice = items.reduce((total, item) => {
        const price = parseFloat(item.pricePerItem!.amount) * item.quantity!;
        return total + price;
    }, 0.0);

    // TODO: Swap out these DEBUG_MOD_CONTROLS with a sandbox mode that mocks the network, instead. Leaving here for now during early development.

    if (DEBUG_CTRL.USE_MOCK_LIGHTNING_INVOICE) console.log("DEBUG MODE ===> [finalizeTransaction]: USING MOCK LIGHTNING INVOICE");

    const createInvoiceResponse = DEBUG_CTRL.USE_MOCK_LIGHTNING_INVOICE ? mockCreateInvoiceResponse : await createInvoice(orderId, totalPrice);
    if (!createInvoiceResponse.success) return { success: false, messageToCustomer: createInvoiceResponse.message! };

    console.log("[finalizeTransaction]: Lightning invoice successfully created for Order ID:", orderId);

    if (DEBUG_CTRL.SUPPRESS_OUTBOUND_MESSAGES) console.log("DEBUG MODE ===> [finalizeTransaction]: SUPPRESSING OUTBOUND MESSAGES!");

    // Send the invoice to the customer
    const paymentRequestMessageObj = { recipient: customerPubkey, orderId, amount: totalPrice.toString(), lnInvoice: createInvoiceResponse.lightningInvoice! };
    const sendMessageResponse = DEBUG_CTRL.SUPPRESS_OUTBOUND_MESSAGES ? { success: true, message: "" } : await sendPaymentRequestMessage(paymentRequestMessageObj);
    if (!sendMessageResponse.success) return { success: false, messageToCustomer: sendMessageResponse.message! };

    console.log(`[finalizeTransaction]: Payment request sent to ${customerPubkey} for ${orderId}`);
    return { success: true, transaction };

}

const mockCreateInvoiceResponse: CreateInvoiceResponse = {
    success: true,
    lightningInvoice: "lnbc1111_MOCK_INVOICE"
}
