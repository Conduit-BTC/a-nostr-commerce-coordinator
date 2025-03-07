import { OrderUtils, ProductListingUtils, type Order, type ProductListing } from "nostr-commerce-schema";
import { getProduct } from "./getProduct";
import { CHECKOUT_ERROR } from "./checkoutErrors";

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

type ValidateOrderResponse = {
    success: boolean,
    messageToCustomer: string,
    transaction?: Transaction,
}

type ProcessOrderStepResponse = {
    success: boolean;
    error?: any;
    messageToCustomer: string;
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

type Transaction = {
    items: TransactionProduct[];
    event: Order;
    totalPrice: {
        amount: number;
        currency: string;
    },
};

export default async function processOrder(event: Order): Promise<ProcessOrderStepResponse> {
    try {
        const validateOrderResponse = await verifyNewOrder(event);
        if (!validateOrderResponse.success) {
            return {
                success: false,
                messageToCustomer: validateOrderResponse.messageToCustomer,
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

async function verifyNewOrder(event: Order): Promise<ValidateOrderResponse> {
    try {
        console.log("[verifyNewOrder]: Verifying new order...");
        const items: OrderItem[] = OrderUtils.getOrderItems(event);
        const { transactionItems, missingItems } = await prepareTransactionItems(items);

        if (transactionItems.length === 0 || missingItems.length > 0) {
            console.error(`[verifyNewOrder]: Issue with items in Order ID: ${OrderUtils.getOrderId(event)}`);
            return {
                success: false,
                messageToCustomer: "[Commerce Coordinator Bot]: Sorry, I ran into a problem. I'll contact you shortly to proceed with your order."
            };
        }

        const transaction = { items: transactionItems, event } as Transaction;
        const validateTransactionResponse = validateTransaction(transaction);

        if (!validateTransactionResponse.success) {
            console.error(`[verifyNewOrder]: Issue with transaction in Order ID: ${OrderUtils.getOrderId(event)}`);
            return {
                success: false,
                messageToCustomer: validateTransactionResponse.messageToCustomer,
            };
        }

        const finalizeTransactionResponse = finalizeTransaction(transaction);
        if (!finalizeTransactionResponse.success) {
            console.error(`[verifyNewOrder]: Issue with finalizing transaction in Order ID: ${OrderUtils.getOrderId(event)}`);
            return {
                success: false,
                messageToCustomer: finalizeTransactionResponse.messageToCustomer,
            };
        }

        console.log("[processOrder]: Transaction complete for Order ID: ", OrderUtils.getOrderId(event));

        return {
            success: true,
            messageToCustomer: "Order successfully processed",
            transaction,
        };
    } catch (error) {
        console.error("validateOrder failed:", error);
        return { success: false, messageToCustomer: "Order validation failed. Contact Merchant." };
    }
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

function validateTransaction(transaction: Transaction): ProcessOrderStepResponse {
    const { items } = transaction;

    const stockCheckErrors: ProcessOrderStepResponse[] = [];

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

function finalizeTransaction(transaction: Transaction): ProcessOrderStepResponse {
    console.warn("[finalizeTransaction]: NOT IMPLEMENTED YET!");

    return { success: false, messageToCustomer: "Not implemented yet." };

    // const { items, event } = transaction;

    // const totalPrice = items.reduce((total, item) => {
    //     const price = parseFloat(item.pricePerItem!.amount) * item.quantity!;
    //     return total + price;
    // }, 0.0);

    // TODO: Generate an invoice and send it to the Customer
    // const lnInvoice = LightningProviderInterface.createInvoice({
    //     amount: totalPrice,
    //     orderId: OrderUtils.getOrderId(event),
    // });

    // TODO: Mark the Order as "processing" and send it to a WaitingForPayment queue

}
