import { QUEUE_NAME } from "@/utils/constants";
import { dmQueueEventHandler } from "./handlers/dmEventHandler";
import { orderEventHandler } from "./handlers/orderEventHandler";

export const dmQueueConfig = {
    name: QUEUE_NAME.DIRECT_MESSAGES,
    handler: dmQueueEventHandler,
}

export const orderQueueConfig = {
    name: QUEUE_NAME.ORDERS,
    handler: orderEventHandler,
}
