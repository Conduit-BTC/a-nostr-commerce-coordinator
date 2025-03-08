import subscribeDirectMessages from "@/core/subscribeDirectMessages";
import synchronizeProducts from "@/core/products/synchronizeProducts";
import { Queue, QueueRegistry } from "./queues/Queue";
import getDb from "./services/dbService";
import { DB_NAME } from "./utils/constants";
import { ignoredEventIds } from "./utils/shouldIgnoreEvent";
import { dmQueueConfig, orderQueueConfig } from "./queues";
import type { Order } from "nostr-commerce-schema";
import type { NostrEvent } from "@nostr-dev-kit/ndk";
import isDebugMode, { DEBUG_CTRL } from "../dev/utils/debugModeControls";

function verifyEnvVars(): void {
    if (!process.env.PUBKEY || !process.env.PRIVKEY) { throw new Error(`[subscribeDirectMessages]: PUBKEY or PRIVKEY not found in .env`) }
    if (!process.env.STRIKE_API_KEY) { throw new Error(`[subscribeDirectMessages]: STRIKE_API_KEY not found in .env`) }

    if (isDebugMode()) {
        // TODO: Swap out these DEBUG_MOD_CONTROLS with a sandbox mode that mocks the network, instead. Leaving here for now during early development.
        console.log("\n===== Developer Mode Variables =====\n")
        console.log("USE_TEST_PAYMENT_AMOUNT: ", DEBUG_CTRL.USE_TEST_PAYMENT_AMOUNT);
        console.log("USE_MOCK_LIGHTNING_INVOICE: ", DEBUG_CTRL.USE_MOCK_LIGHTNING_INVOICE);
        console.log("SUPPRESS_OUTBOUND_MESSAGES", DEBUG_CTRL.SUPPRESS_OUTBOUND_MESSAGES);
        console.log("\n===== END Developer Mode Variables =====\n")
    }
}

function initQueues(): void {
    console.log("\n----------------------------------------")
    console.log("[startup]: Initializing Direct Message Queue...\n\n")
    QueueRegistry.set(dmQueueConfig.name, new Queue<NostrEvent>(dmQueueConfig.name, dmQueueConfig.handler));
    console.log(`Queue initialized: ${dmQueueConfig.name}`)

    console.log("[startup]: Initializing Order Processing Queue...\n\n")
    QueueRegistry.set(orderQueueConfig.name, new Queue<{ order: Order, customerPubkey: string }>(orderQueueConfig.name, orderQueueConfig.handler));
    console.log(`Queue initialized: ${orderQueueConfig.name}`)

    console.log("----------------------------------------\n")
}

function initIgnoredEvents(): void {
    const processingOrdersDb = getDb().openDB({ name: DB_NAME.PROCESSING_ORDERS });
    const successfulOrdersDb = getDb().openDB({ name: DB_NAME.SUCCESSFUL_ORDERS });
    const failedOrdersDb = getDb().openDB({ name: DB_NAME.FAILED_ORDERS });
    const ignoredEventsDb = getDb().openDB({ name: DB_NAME.IGNORED_EVENTS });

    ignoredEventsDb.getKeys().forEach(key => ignoredEventIds.add(key.toString().split(":")[1]));
    processingOrdersDb.getKeys().forEach(key => ignoredEventIds.add(key.toString().split(":")[1]));
    successfulOrdersDb.getKeys().forEach(key => ignoredEventIds.add(key.toString().split(":")[1]));
    failedOrdersDb.getKeys().forEach(key => ignoredEventIds.add(key.toString().split(":")[1]));
}

export default async function startup(): Promise<void> {
    try {
        console.log("Commerce Coordinator starting up...");

        verifyEnvVars();
        initQueues();
        initIgnoredEvents();

        // TODO: Fetch Receipt events from the Relay Pool and store them in the database

        await synchronizeProducts();
        await subscribeDirectMessages();
    } catch (error) {
        console.error(`Startup failed: ${error}`);
        process.exit(1);
    }
}
