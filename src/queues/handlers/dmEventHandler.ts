import getDb from "@/services/dbService";
import { OrderUtils, validateOrder, type Order } from "nostr-commerce-schema";
import { NDKEvent, NDKPrivateKeySigner, NDKUser, type NostrEvent } from "@nostr-dev-kit/ndk";
import { getQueue, QueueRegistry, type QueueItem } from "../Queue";
import { DB_NAME, ORDER_MESSAGE_TYPE, ORDER_STATUS, QUEUE_NAME } from "@/types/enums";
import { sendOrderStatusUpdateMessage } from "@/utils/directMessageUtils";


const privkey = process.env.PRIVKEY
const signer = new NDKPrivateKeySigner(privkey);

export async function dmQueueEventHandler(queueItem: QueueItem<NostrEvent>) {
    // Events added to this queue haven't been encountered by the Coordinator before. If they are not Cooridinator-handled message types, they will be added to the ignore list. Otherwise, they will be processed.

    try {
        const event = queueItem.data;
        console.log("[subscribeDirectMessages]: Processing DM from queue...")

        // NIP-17 Decryption + Validation
        const seal: string = await signer.decrypt(new NDKUser({ pubkey: event.pubkey }), event.content)
        const sealJson = JSON.parse(seal)
        const rumor: string = await signer.decrypt(new NDKUser({ pubkey: sealJson.pubkey }), sealJson.content)
        const rumorJson: NDKEvent = JSON.parse(rumor)

        // TODO: Check rumorJson's kind and tags to determine which kind of event it is, then handle accordingly

        const order = validateOrder(rumorJson)

        if (order.success) {
            // Move this to the orders queue
            QueueRegistry.get(QUEUE_NAME.ORDERS)?.push({ order: order.data, customerPubkey: sealJson.pubkey });
            QueueRegistry.get(QUEUE_NAME.DIRECT_MESSAGES)?.confirmProcessed(queueItem.id);
            return;
        }

        // TODO: Instead of rejecting non-spec orders, move the Order to a manual flow where the Merchant can review the order and decide whether to accept or reject it.
        handleRejectedOrder(rumorJson, event.pubkey);

        // We've determined this is not a valid order event. It may be a different type of Coordinator-handled message from the Customer, but we aren't handling those yet.
        getQueue(QUEUE_NAME.DIRECT_MESSAGES).confirmProcessed(queueItem.id);
        getDb().openDB({ name: DB_NAME.IGNORED_EVENTS }).put(`nostr-ignored-event:${event.id}`, true);
    } catch (error) {
        console.error(`[subscribeDirectMessages]: Failed to process order event: ${error}`);
        getQueue(QUEUE_NAME.DIRECT_MESSAGES).confirmProcessed(queueItem.id);
        return;
    }
}

function handleRejectedOrder(event: NDKEvent, customerPubkey: string) {
    // If the order isn't valid, but the event is still a Coordinator-handled message, we should send the Customer a message letting them know.

    const rejectedOrder = event.rawEvent() as unknown as Order;
    if (rejectedOrder.kind !== 16 || OrderUtils.getOrderId(rejectedOrder) == null) return;

    const messageObj = {
        recipient: customerPubkey,
        orderId: OrderUtils.getOrderId(rejectedOrder)!,
        status: ORDER_STATUS.CANCELLED,
        type: ORDER_MESSAGE_TYPE.STATUS_UPDATE,
        message: "It looks like you're using an e-commerce client doesn't create Order Events compatible with the GammaMarkets Market Spec. This Merchant can't settle this order, at this time. Please contact the dev team that maintains your client, and give them this link: https://github.com/GammaMarkets/market-spec/blob/main/spec.md"
    }

    sendOrderStatusUpdateMessage(messageObj);
}
