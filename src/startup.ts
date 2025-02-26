import subscribeOrders from "@/core/checkout/subscribeOrders";
import synchronizeProducts from "@/core/products/synchronizeProducts";

function verifyEnvVars(): void {
    if (!process.env.PUBKEY || !process.env.PRIVKEY) { throw new Error(`[subscribeOrders]: PUBKEY or PRIVKEY not found in .env`) }
}

export default async function startup(): Promise<void> {
    try {
        console.log("Commerce Coordinator starting up...");

        verifyEnvVars();
        await synchronizeProducts();
        // TODO: Fetch Receipt events from the Relay Pool and store them in the database
        await subscribeOrders();
    } catch (error) {
        console.error(`Startup failed: ${error}`);
        process.exit(1);
    }
}
