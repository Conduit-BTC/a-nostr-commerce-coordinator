import { invoiceWebhookDetails } from "@/utils/constants";
import { handleInvoiceWebhook } from "@/server/webhooks/handleInvoiceWebhook";

export function startWebhookServer() {
    const { port, path, method } = invoiceWebhookDetails;
    const server = Bun.serve({
        port,
        async fetch(req: Request): Promise<Response> {
            const url = new URL(req.url);
            if (url.pathname === path && req.method === method) {
                await handleInvoiceWebhook(req);
                return new Response("Webhook received", { status: 200 });
            }

            return new Response("Not Found", { status: 404 });
        }
    });

    console.log(`[startServer]: Invoice webhook running on ${server.url}`);
}
