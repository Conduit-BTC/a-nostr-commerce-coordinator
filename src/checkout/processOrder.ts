import type { OrderEvent } from "@/utils/zod/nostrOrderSchema";
import type { NDKEvent } from "@nostr-dev-kit/ndk";

type ValidateOrderResponse = {
    success: boolean,
    messageToCustomer: string,
}

async function validateOrder(orderEvent: OrderEvent): Promise<ValidateOrderResponse> {
    return { success: false, messageToCustomer: "Order didn't pass validation" };

    // TODO - validateOrder
    // Fetch the Product from the DB
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

    //     const items = await Promise.all(orderEvent.tags
    //         .filter(tag => tag[0] === "item")
    //         .map(async tag => {
    //             const productId = tag[1].split(":")[2].split("___")[0]
    //             const variantId = tag[1].split(":")[2].split("___")[1]
    //             const quantity = tag[2]

    //             const prices = await getPricesWorkflow().run({ input: { variantId } })
    //             console.log(">>>>>> Prices: ", prices)

    //             return {
    //                 productId,
    //                 variantId,
    //                 quantity,
    //                 // prices
    //             }
    //         })
    //     );

    //     let products: any[] = [];
    //     let missingProductIds: string[] = []; // If the product isn't found in the database, we'll need to fetch it from the relay pool
    //     for (let item of items) {
    //         const { result: productVariantResult } = await getProductVariantWorkflow().run({ input: { variantId: item.variantId } })
    //         const product = productVariantResult.variant;
    //         const { result: salesChannelsResult } = await getProductSalesChannelsWorkflow().run({ input: { productId: item.productId } })
    //         const salesChannels = salesChannelsResult.productSalesChannels;
    //         console.log(">>>>>>> Sales channels: ", salesChannels)

    //         // product["unit_price"] = item.prices[0] // TODO: Replace with real price
    //         product["unit_price"] = 123.45 // TODO: Replace with real price
    //         product["quantity"] = item.quantity

    //         if (product) products.push(product)
    //         else missingProductIds.push(item.productId)
    //     }
    //     if (missingProductIds.length > 0) {
    //         console.error(`[orderSubscriptionLoader]: Missing products: ${missingProductIds}`)
    //     }

    //     // TODO: If there are missing products, we need to fetch them from the relay pool
    //     // TODO: Include a special tag on the order that includes the item's complete event. If that info isn't present, do the lookup (for other clients)
    //     // TODO: Discuss with the RoundTable team : We should contain a full copy of the product event in the order event, so that we can process the order without needing to look up the product event from the relay pool.
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
    //     console.info(`[orderSubscriptionLoader]: Creating cart for order...`)
    //     const cart = await createCartWorkflow(container).run({ input })

    //     console.info(`[orderSubscriptionLoader]: Cart created: ${cart}`)

    //     return new StepResponse({
    //         cart,
    //     });
    // } catch (error) {
    //     console.error(`[processOrder]: Failed to create cart: ${error}`);
    //     throw error;
}

type ProcessOrderArgs = {
    orderEvent: OrderEvent,
    orderNdkEvent: NDKEvent,
}

type ProcessOrderResponse = {
    success: boolean,
    messageToCustomer: string,
}

async function processOrder(input: ProcessOrderArgs): Promise<ProcessOrderResponse> {
    try {
        const { orderEvent } = input;
        const validateOrderResponse = await validateOrder(orderEvent);
        if (validateOrderResponse.success === false) {
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

export default processOrder;
