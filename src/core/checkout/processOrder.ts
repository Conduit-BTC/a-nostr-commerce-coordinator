import getDb from "@/services/dbService";
import { PRODUCT_EVENTS_DB_NAME } from "@/utils/constants";
import type { OrderEvent } from "@/utils/zod/nostrOrderSchema";
import type { NDKEvent } from "@nostr-dev-kit/ndk";

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

export default async function processOrder(event: OrderEvent): Promise<ProcessOrderResponse> {
    console.log("[processOrder]: Processing order...")

    try {
        const validateOrderResponse = await validateOrder(event);
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

async function validateOrder(event: OrderEvent): Promise<ValidateOrderResponse> {

    // TODO - validateOrder
    // Fetch the Product from the DB
    console.log("Event: ", event);
    // const productDb = await getDb().openDB({ name: PRODUCT_EVENTS_DB_NAME });
    // const product = await productDb.get(event.productId);
    // If the Product isn't available in the DB, fetch it from the relay pool (Home Relay first)
    // If the Product is missing, then the Coordinator is malfunctioning. Raise an alert.

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

    try {
        return { success: false, messageToCustomer: "validateOrder isn't implemented yet!" };
    } catch (error) {
        console.error("validateOrder failed:", error);
        return { success: false, messageToCustomer: "Order validation failed. Contact Merchant." };
    }
}



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
