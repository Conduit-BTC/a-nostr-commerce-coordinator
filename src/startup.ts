import subscribeDirectMessages from "@/modules/direct-messages/subscribeDirectMessages";
import synchronizeProducts from "@/modules/products/synchronizeProducts";
import { Queue, QueueRegistry } from "./queues/Queue";
import getDb from "./services/dbService";
import { ignoredEventIds } from "./utils/shouldIgnoreEvent";
import { dmQueueConfig, orderQueueConfig } from "./queues";
import type { Order } from "nostr-commerce-schema";
import type { NostrEvent } from "@nostr-dev-kit/ndk";
import isDebugMode, { DEBUG_CTRL } from "../dev/utils/debugModeControls";
import { DB_NAME } from "./utils/constants";
import { startWebhookServer } from "./services/webhook-server/startServer";
import synchronizeShippingOptions from "./modules/shipping-options/synchronizeShippingOptions";

// TODO: All env vars must be moved out of the Coordinator. Some form of remote-hosted NSEC Bunker API will receive all sign & decrypt requests from the Coordinator, and a Secrets Manager will be used for the non-NSEC env vars.

const requiredEnvVars = [
    'PUBKEY',
    'PRIVKEY',
    'STRIKE_API_KEY',
    'USPS_CLIENT_ID',
    'SHIPSTATION_API_KEY',
    'SHIPSTATION_API_SECRET'
];

// TODO: Swap out DEBUG_MOD_CONTROLS app-wide with better debugging practice that doesn't litter the source code. Leaving here for now during early development.

const debugFlags = [
    'USE_TEST_PAYMENT_AMOUNT',
    'USE_MOCK_LIGHTNING_INVOICE',
    'SUPPRESS_OUTBOUND_MESSAGES',
]

function verifyEnvVars(required: string[], debug: string[]): void {
    // TODO: Recursively do this
    required.forEach((key) => {
        if (!process.env[key]) throw new Error(`[startup > verifyEnvVars]: Environment Variable missing: ${key}`);
    })

    if (!isDebugMode()) return

    debug.forEach((key) => {
        if (process.env[key] === undefined) {
            throw new Error(`[startup > verifyDebugEnvVars]: Missing debug env var: ${key}`);
        }
    });
}


function initSettings(): void {
    /**
     * Before the Coordinator starts, the following details must be set by the Merchant, and/or the Merchant must be explicitly informed of the implications of not setting optional values: 
     * 
     * - Shipping origin zip code. Required for variable shipping cost calculation
     * - Shipping outbound address. Required for variable shipping cost calculation.
     * - Package specifications. Required for variable shipping cost calculation.
     * 
     * See type: MerchantSettings
    */

    // TODO: Perform a verification: Are there any ProductListings with dimensions that are larger than all available MerchantPackageSpecs? If so, notify the Merchant. Otherwise, the variable shipping price calculator will throw at generatePackages().
    console.error("[startup] <<< verifyMerchantSettings not implemented! See function definition for more details\n")
    console.log("[startup] Merchant Settings:")

    const settingsDb = getDb().openDB({ name: DB_NAME.SETTINGS });
    settingsDb.putSync("merchant_zip_code", 12345)
    settingsDb.getRange().forEach(({ key, value }) => {
        console.log(`> ${String(key)}: ${String(value)}`)
    })
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
        console.log("⚡⚡⚡ Commerce Coordinator starting up... ⚡⚡⚡");

        verifyEnvVars(requiredEnvVars, debugFlags);
        initSettings();
        initQueues();
        initIgnoredEvents();

        // TODO: Fetch Receipt events from the Relay Pool and store them in the database

        startWebhookServer();
        await synchronizeProducts();
        await synchronizeShippingOptions();
        await subscribeDirectMessages();
    } catch (error) {
        console.error(`Startup failed: ${error}`);
        process.exit(1);
    }
}
