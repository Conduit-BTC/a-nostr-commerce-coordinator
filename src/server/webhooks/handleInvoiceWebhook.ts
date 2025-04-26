import { processPayment } from "@/core/checkout/processPayment";
import { getStrikeInvoiceDetails } from "@/interfaces/payment/providers/StrikePaymentProvider";
import { INVOICE_STATUS } from "@/utils/constants";

export async function handleInvoiceWebhook(req: Request): Promise<void> {
    try {
        // The API sending the webhook expects a 200 response; otherwise, it will retry sending the webhook.
        console.log('[handleInvoiceWebhook]: Received request to /webhook/invoice. Validating...');
        const body = await req.json();
        const invoiceId = body?.data?.entityId;

        if (!invoiceId) {
            console.warn('[handleInvoiceWebhook]: WARNING: No entityId (invoiceId) in webhook request body. The request body is:', body);
            return;
        }

        if (!body.eventType || body.eventType !== 'invoice.updated') {
            return
        };

        const invoiceDetails = await getStrikeInvoiceDetails(invoiceId);
        if (!invoiceDetails || !invoiceDetails.state) {
            console.log('[handleInvoiceWebhook]: Invoice not found. Ignoring webhook request.');
            return;
        };
        if (invoiceDetails.state !== INVOICE_STATUS.PAID) {
            console.log('[handleInvoiceWebhook]: Invoice is not in PAID state. Ignoring webhook request.');
            return;
        };

        // TODO: Handle additional invoice states

        console.log("[handleInvoiceWebhook] Valid payment webhook received. Starting payment processing...");
        processPayment(invoiceId);
    } catch (error) {
        console.error(
            '[handleInvoiceWebhook] ERROR: There was a problem processing webhook request:',
            error
        );
    }
}
