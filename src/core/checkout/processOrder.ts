import { OrderUtils, ProductListingUtils, type Order } from "nostr-commerce-schema";
import { getProduct } from "./getProduct";
import { createInvoice } from "@/interfaces/payment/LightningInterface";
import { sendPaymentRequestMessage } from "@/utils/directMessageUtils";
import { DEBUG_CTRL } from "dev/utils/debugModeControls";
import getDb from "@/services/dbService";
import {
    type CreateInvoiceResponse,
    type CreateTransactionResponse,
    type OrderItem,
    type PerformTransactionPipelineResponse,
    type ProcessOrderResponse,
    type Transaction,
    type TransactionProduct
} from "@/types/types";
import { PAYMENT_TYPE, PAYMENT_STATUS, CHECKOUT_ERROR, DB_NAME } from "@/types/enums";
import { exposeForTesting } from "@/utils/exposeForTesting";


export default async function processOrder(event: Order, customerPubkey: string): Promise<ProcessOrderResponse> {
    try {
        console.log("[verifyNewOrder]: Processing new order...");

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
        console.error("Product sync workflow failed:", error);
        return { success: false, messageToCustomer: "Order processing failed. Contact Merchant." };
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

    // We're only supporting USD base currency for now. This was assured in validateTransaction(). This will need to be updated to support multiple currencies.
    const amount = transactionItems.reduce((total, item) => {
        const price = parseFloat(item.pricePerItem!.amount) * item.quantity!;
        return total + price;
    }, 0.0);

    const transaction = {
        orderId,
        items: transactionItems,
        event: order,
        customerPubkey,
        timeline: { created_at: Date.now() },
        totalPrice: { amount, currency: "USD" } // TODO: USD is hard-coded. Change it to the currency of the Product.
    } as Transaction;

    return { success: true, transaction };
}

async function prepareTransactionItems(orderItems: OrderItem[]): Promise<{ transactionItems: TransactionProduct[], missingItems: TransactionProduct[] }> {
    const itemPromises: Promise<TransactionProduct>[] = orderItems.map(async (item) => {
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
    // TODO: This is brittle at the moment, since it assumes all products are in the same currency. An easy assumption to make, but the protocol allows each Product to have a different currency, so this could cause a problem.
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
    const { totalPrice, orderId, customerPubkey } = transaction;

    // TODO: Swap out these DEBUG_MOD_CONTROLS with a sandbox mode that mocks the network, instead. Leaving here for now during early development.

    if (DEBUG_CTRL.USE_MOCK_LIGHTNING_INVOICE) console.log("\n===> DEBUG MODE ===> [finalizeTransaction]: USING MOCK LIGHTNING INVOICE\n");

    const createInvoiceResponse = DEBUG_CTRL.USE_MOCK_LIGHTNING_INVOICE ? mockCreateInvoiceResponse : await createInvoice(orderId, totalPrice);
    if (!createInvoiceResponse.success) return { success: false, messageToCustomer: createInvoiceResponse.message! };

    console.log("[finalizeTransaction]: Lightning invoice successfully created for Order ID:", orderId);

    transaction.payment = {
        amount: totalPrice!.amount,
        currency: totalPrice!.currency,
        type: PAYMENT_TYPE.LIGHTNING_BTC,
        status: PAYMENT_STATUS.REQUESTED,
        details: {
            invoiceId: createInvoiceResponse.invoiceId!,
            lightningInvoice: createInvoiceResponse.lightningInvoice!,
        }
    }

    // Save the transaction to the Processing Orders DB
    await getDb().openDB({ name: DB_NAME.PROCESSING_ORDERS }).put(orderId, transaction);
    await getDb().openDB({ name: DB_NAME.PROCESSING_ORDERS_INVOICE_ID_INDEX }).put(transaction.payment!.details.invoiceId, orderId);

    console.log(`[finalizeTransaction]: Transaction saved to Processing Orders DB under key ${orderId}. Indexed by invoice ID ${transaction.payment!.details.invoiceId}`);

    if (DEBUG_CTRL.SUPPRESS_OUTBOUND_MESSAGES) console.log("\n===> DEBUG MODE ===> [finalizeTransaction]: SUPPRESSING OUTBOUND MESSAGES!\n");

    // TODO: Handle free, zero-cost transactions
    // Send the invoice to the customer
    const paymentRequestMessageObj = { recipient: customerPubkey, orderId, amount: totalPrice.toString(), lnInvoice: createInvoiceResponse.lightningInvoice! };
    const sendMessageResponse = DEBUG_CTRL.SUPPRESS_OUTBOUND_MESSAGES ? { success: true, message: "" } : await sendPaymentRequestMessage(paymentRequestMessageObj);
    if (!sendMessageResponse.success) return { success: false, messageToCustomer: sendMessageResponse.message! };

    console.log(`[finalizeTransaction]: Payment request sent to ${customerPubkey} for ${orderId}`);
    return { success: true, transaction };
}

const mockCreateInvoiceResponse: CreateInvoiceResponse = {
    success: true,
    lightningInvoice: "lnbc1111_MOCK_INVOICE",
    invoiceId: "MOCK_INVOICE_ID"
}

// exposeForTesting({ prepareTransactionItems, validateTransaction, finalizeTransaction });
export const { prepareTransactionItems: prepareTransactionItems_TEST } =
    exposeForTesting({ prepareTransactionItems });
