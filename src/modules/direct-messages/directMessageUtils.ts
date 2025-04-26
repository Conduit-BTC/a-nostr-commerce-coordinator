import { getNdk } from "@/services/ndkService";
import { NIP17_KIND, ORDER_MESSAGE_TYPE, type FULFILLMENT_STATUS, type ORDER_STATUS } from "@/utils/constants";
import type { PaymentRequestArgs, ReceiptArgs } from "@/types/types";
import { NDKEvent, NDKPrivateKeySigner, NDKRelay, NDKUser } from "@nostr-dev-kit/ndk";
import { generateSecretKey, getPublicKey } from "nostr-tools";

export async function sendDirectMessage(recipient: string, message: string): Promise<{ success: boolean, message: string }> {
    try {
        const event = await createNip17GiftWrapEvent(NIP17_KIND.MESSAGE, recipient, message);
        const { success } = await postEvent(event);

        if (success) return { success: true, message: "Direct message sent successfully" };
        return { success: false, message: "Direct message was created, but didn't publish to the relay pool." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "There was an error while trying to send a direct message." };
    }
}

type OrderStatusUpdateArgs = {
    recipient: string;
    orderId: string;
    status: ORDER_STATUS | FULFILLMENT_STATUS;
    type: ORDER_MESSAGE_TYPE;
    message: string;
    tags?: string[][];
}

export async function sendOrderStatusUpdateMessage({ recipient, orderId, status, type, message, tags: extraTags }: OrderStatusUpdateArgs): Promise<{ success: boolean, message: string }> {
    try {
        const kind = NIP17_KIND.ORDER_PROCESSING;

        const tags = [
            ["subject", "order-info"],
            ["type", type], // Status update
            ["order", orderId],
            ["status", status],
        ];

        if (extraTags) tags.push(...extraTags);

        const event = await createNip17GiftWrapEvent(kind, recipient, message, type, tags);
        const { success } = await postEvent(event);

        if (success) return { success: true, message: "Order status DM sent successfully" };
        return { success: false, message: "Order status DM was created, but didn't publish to the relay pool." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "There was an error while trying to send an order status DM." };
    }
}

export async function sendPaymentRequestMessage({ recipient, orderId, amount, lnInvoice }: PaymentRequestArgs): Promise<{ success: boolean, message: string }> {
    try {
        const kind = NIP17_KIND.ORDER_PROCESSING;
        const type = ORDER_MESSAGE_TYPE.PAYMENT_REQUEST;
        const tags = [
            ["subject", "order-payment"],
            ["type", type],
            ["order", orderId],
            ["amount", amount],
            ["payment", "lightning", lnInvoice]
        ];

        const event = await createNip17GiftWrapEvent(kind, recipient, "Payment request", type, tags);
        const { success } = await postEvent(event);

        if (success) return { success: true, message: "Payment request sent successfully" };
        return { success: false, message: "Payment request was created, but didn't publish to the relay pool." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "There was an error while trying to send a payment request." };
    }
};

export async function sendReceiptMessage({ recipient, orderId, amount, lnInvoice, lnPaymentHash }: ReceiptArgs): Promise<{ success: boolean, message: string }> {
    try {
        const kind = NIP17_KIND.RECEIPT;
        const tags = [
            ["subject", "order-payment"],
            ["order", orderId],
            ["payment", "lightning", lnInvoice, lnPaymentHash],
            ["amount", amount]
        ];

        const event = await createNip17GiftWrapEvent(kind, recipient, "Payment confirmation details", undefined, tags);
        const { success } = await postEvent(event);

        if (success) return { success: true, message: "Payment confirmation sent successfully" };
        return { success: false, message: "Payment confirmation was created, but didn't publish to the relay pool." };
    } catch (error) {
        console.error(error);
        return { success: false, message: "There was an error while trying to send a payment confirmation." };
    }
};

async function createNip17GiftWrapEvent(kind: NIP17_KIND, recipient: string, message: string, type?: ORDER_MESSAGE_TYPE, tags?: string[][]): Promise<NDKEvent> {
    const ndk = await getNdk();
    const rumor = new NDKEvent(ndk);

    const rumorTags = [
        ["p", recipient],
    ];

    if (type) rumorTags.push(["type", type.toString()]);
    if (tags) rumorTags.push(...tags);

    rumor.kind = kind;
    rumor.tags = rumorTags;
    rumor.content = message;

    // Create seal (kind 13)
    const sealEvent = new NDKEvent(ndk);
    sealEvent.kind = 13;
    const time = Math.floor(Date.now() / 1000);
    sealEvent.created_at = time;

    const recipientNdkUser = new NDKUser({ pubkey: recipient });

    // Encrypt the order content
    sealEvent.content = await ndk.signer!.encrypt(
        recipientNdkUser,
        JSON.stringify(rumor)
    );

    await sealEvent.sign();

    // Create gift wrap (kind 1059)
    const giftWrapEvent = new NDKEvent(ndk);
    giftWrapEvent.kind = 1059;
    giftWrapEvent.created_at = time;
    giftWrapEvent.tags = [['p', recipient]];

    // Generate random keypair for gift wrap
    const randomPrivateKey = generateSecretKey();
    const randomPubkey = getPublicKey(randomPrivateKey);
    const randomSigner = new NDKPrivateKeySigner(randomPrivateKey);

    // Encrypt the seal
    giftWrapEvent.pubkey = randomPubkey;
    giftWrapEvent.content = await randomSigner.encrypt(
        recipientNdkUser,
        JSON.stringify(sealEvent),
    );

    // Sign the gift wrap with random private key
    await giftWrapEvent.sign(randomSigner);

    return giftWrapEvent;
}

async function postEvent(event: NDKEvent): Promise<{ success: boolean, message: string }> {
    try {
        const relays: Set<NDKRelay> = await event.publish();
        return { success: relays.size > 0, message: "Event posted successfully" };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to post event" };
    }
}
