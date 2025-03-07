import subscribeDirectMessages from "@/core/subscribeDirectMessages";
import synchronizeProducts from "@/core/products/synchronizeProducts";
import { NostrEventQueue, NostrEventQueueRegistry } from "./queues/NostrEventQueue";
import NostrEventQueueHandlers from "./queues/handlers";

function verifyEnvVars(): void {
    if (!process.env.PUBKEY || !process.env.PRIVKEY) { throw new Error(`[subscribeDirectMessages]: PUBKEY or PRIVKEY not found in .env`) }
    if (!process.env.STRIKE_API_KEY) { throw new Error(`[subscribeDirectMessages]: STRIKE_API_KEY not found in .env`) }

    if (process.env.TEST_PAYMENT_FLOW === "true") {
        console.log("\n===== Developer Mode Variables =====\n")
        console.log("TEST_PAYMENT_FLOW: ", process.env.TEST_PAYMENT_FLOW);
        console.log("\n=== END Developer Mode Variables ===\n")
    }
}

function initQueues(): void {
    console.log("\n----------------------------------------")
    console.log("[startup]: Initializing queues...\n")
    for (const [name, handler] of Object.entries(NostrEventQueueHandlers)) {
        NostrEventQueueRegistry.set(name, new NostrEventQueue(name, handler));
        console.log(`Queue initialized: ${name}`)
    }
    console.log("\n[startup]: Queues initialized")
    console.log("----------------------------------------\n")
}

export default async function startup(): Promise<void> {
    try {
        console.log("Commerce Coordinator starting up...");

        verifyEnvVars();
        initQueues();
        await synchronizeProducts();
        // TODO: Fetch Receipt events from the Relay Pool and store them in the database
        await subscribeDirectMessages();
    } catch (error) {
        console.error(`Startup failed: ${error}`);
        process.exit(1);
    }
}
