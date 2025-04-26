import { OrderUtils, type Order } from "nostr-commerce-schema";
import { type QueueItem } from "../Queue";
import processOrder from "@/core/checkout/processOrder";
import { outputAllStoresToConsole } from "dev/utils/outputAllStoresToConsole";
import { DEBUG_CTRL } from "dev/utils/debugModeControls";
import { ORDER_MESSAGE_TYPE, ORDER_STATUS } from "@/utils/constants";
import { sendOrderStatusUpdateMessage } from "@/utils/directMessageUtils";

export async function orderEventHandler(queueItem: QueueItem<{ order: Order, customerPubkey: string }>) {
    try {
        console.log("[orderEventHandler]: Processing order event from queue...")
        const { order, customerPubkey } = queueItem.data;

        outputAllStoresToConsole()

        // TODO: Check order-id against all Receipt events, and if it's already been processed, ignore it in the future. An order may make it this far if the database was previously wiped, or some orders have been processed outside of the Coorindator.

        const processOrderResult = await processOrder(order, customerPubkey);
        if (!processOrderResult?.success) {
            const failedOrderMessageObj = {
                recipient: customerPubkey,
                orderId: OrderUtils.getOrderId(order) || "order_id_missing",
                status: ORDER_STATUS.CANCELLED,
                type: ORDER_MESSAGE_TYPE.STATUS_UPDATE,
                message: processOrderResult.messageToCustomer || "We ran into a problem while processing your order. We'll contact you shortly to complete your order."
            };

            if (DEBUG_CTRL.SUPPRESS_OUTBOUND_MESSAGES) console.log("\n===> DEBUG MODE ===> [finalizeTransaction]: SUPPRESSING OUTBOUND MESSAGES!\n");

            const sendMessageResponse = DEBUG_CTRL.SUPPRESS_OUTBOUND_MESSAGES ? { success: true, message: "" } : await sendOrderStatusUpdateMessage(failedOrderMessageObj);
            if (!sendMessageResponse.success) throw new Error(`[orderEventHandler]: Failed to send direct message to customer: ${sendMessageResponse.message}`);
        }

        console.info(`[subscribeDirectMessages]: ${OrderUtils.getOrderId(order)} processed. Awaiting payment.`)
        return;
    } catch (error) {
        console.error("[orderEventHandler]: Error processing order event: ", error)
        throw error
    }
}
