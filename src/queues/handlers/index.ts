import { NOSTR_EVENT_QUEUE_NAME } from "@/utils/constants";
import { dmQueueEventHandler } from "./DMQueueEventHandler";
import { failedOrderQueueEventHandler } from "./FailedOrderQueueEventHandler";

const NostrEventQueueHandlers = {
    [NOSTR_EVENT_QUEUE_NAME.PENDING_DIRECT_MESSAGES]: dmQueueEventHandler,
    [NOSTR_EVENT_QUEUE_NAME.FAILED_ORDERS]: failedOrderQueueEventHandler,
}

export default NostrEventQueueHandlers;
