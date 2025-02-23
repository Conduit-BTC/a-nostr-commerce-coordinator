import subscribeOrders from "@/checkout/subscribeOrders";

export default function startup(): void {
    try {
        console.log("Commerce Coordinator starting up...");
        subscribeOrders();
    } catch (error) {
        console.error(`Startup failed: ${error}`);
        process.exit(1);
    }
}
