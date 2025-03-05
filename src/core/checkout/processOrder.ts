import { OrderUtils, ProductListingUtils, type Order } from "nostr-commerce-schema";
import { getProduct } from "./getProduct";
import { CHECKOUT_ERROR } from "./checkoutErrors";

enum PAYMENT_STATUS {
    REQUESTED,
    PARTIAL,
    PAID,
    EXPIRED,
    ERROR
}

enum FULFILLMENT_STATUS {
    PROCESSING,
    COMPLETE,
    ERROR
}

const testOrder = {
    paymentStatus: PAYMENT_STATUS.PAID,
    fulfillmentStatus: FULFILLMENT_STATUS.COMPLETE
}

type ProcessOrderResponse = {
    success: boolean,
    messageToCustomer: string,
}

type ValidateOrderResponse = {
    success: boolean,
    messageToCustomer: string,
}

type TransactionProduct = {
    success: boolean,
    productId?: string,
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
};

export default async function processOrder(event: Order): Promise<ProcessOrderResponse> {
    try {
        const validateOrderResponse = await verifyNewOrder(event);
        if (!validateOrderResponse.success) {
            return {
                success: false,
                messageToCustomer: validateOrderResponse.messageToCustomer,
            };
        }

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
        const transactionItems = await prepareItems(items);
        const transaction = { items: transactionItems } as Transaction;

        console.log("Transaction:", transaction);



        // TODO: "We couldn't find all of the items in your order. Here's what we can find: [list of items found]. Do you want to proceed with the order?"

        // Match the Order's price to the Product's price
        // If they don't match, include very-obvious messaging in the Order that the price has changed, and continue the process.

        // Check the Order's quantity against the Product's available stock
        // If the quantity is more than the Product's available stock, reject the order. Include a message in the Order that the Product has X stock, but the order was for Y quantity. Request the Customer to update their order, and try again.

        // Check the Order's shipping address against the Product's shipping availability
        // If the Product isn't available for shipping to the Order's address, reject the order. Include a message in the Order that the Product isn't available for shipping to the Order's address.

        // Check the Order's payment method against the Product's payment methods
        // If the Product isn't available for the Order's payment method, reject the order. Include a message in the Order that the Product isn't available for the Order's payment method.

        // If all checks pass, return true
        // TODO End
        return { success: false, messageToCustomer: "validateOrder isn't implemented yet!" };

    } catch (error) {
        console.error("validateOrder failed:", error);
        return { success: false, messageToCustomer: "Order validation failed. Contact Merchant." };
    }
}

const preInvoiceStep = async (items: OrderItem[]) => { };

async function prepareItems(orderItems: OrderItem[]): Promise<TransactionProduct[]> {
    const itemPromises: Promise<TransactionProduct>[] = orderItems.map(async (item) => {
        const productId = OrderUtils.getProductIdFromOrderItem(item);
        const product = await getProduct(productId);

        if (product) return {
            success: true,
            productId: productId,
            quantity: item.quantity,
            pricePerItem: ProductListingUtils.getProductPrice(product),
        } as TransactionProduct;

        return {
            success: false,
            error: CHECKOUT_ERROR.PRODUCT_MISSING,
            message: `Product with ID ${productId} not found in database, home relay, or relay pool.`,
        } as TransactionProduct;
    });

    return Promise.all(itemPromises);
};

//     const addressString = orderEvent.tags.find(tag => tag[0] === "address")?.[1];
//     let address: { address1: string, address2?: string, city: string, first_name: string, last_name: string, zip: string } | undefined;
//     if (addressString) address = JSON.parse(addressString);

//     const input: any = {
//         currency_code: "sats",
//         items: products
//     };

//     if (address) {
//         input.shipping_address = {
//             address_1: address.address1,
//             address_2: address.address2,
//             city: address.city,
//             first_name: address.first_name,
//             last_name: address.last_name,
//             postal_code: address.zip,
//         };
//     }
