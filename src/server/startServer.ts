import { handleInvoiceWebhook } from "./webhooks/invoiceWebhooks";

const server = Bun.serve({
    port: 3000,
    async fetch(req: Request): Promise<Response> {
        const url = new URL(req.url);

        if (url.pathname === "/webhooks/invoice/update" && req.method === "POST") {
            handleInvoiceWebhook(req);
            return new Response("Webhook received", { status: 200 });
        }

        return new Response("Not Found", { status: 404 });
    }
});

console.log(`Server running on http://localhost:${server.port}`);
