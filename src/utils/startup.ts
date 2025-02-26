import subscribeOrders from "@/checkout/subscribeOrders";
import synchronizeProducts from "@/products/synchronizeProducts";

function verifyEnvVars(): void {
    if (!process.env.PUBKEY || !process.env.PRIVKEY) { throw new Error(`[subscribeOrders]: PUBKEY or PRIVKEY not found in .env`) }
}

export default function startup(): void {
    try {
        console.log("Commerce Coordinator starting up...");

        verifyEnvVars();
        synchronizeProducts();
        // subscribeOrders();
    } catch (error) {
        console.error(`Startup failed: ${error}`);
        process.exit(1);
    }
}
