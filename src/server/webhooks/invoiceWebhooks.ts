import { processPayment } from "@/core/checkout/processPayment";
import { getStrikeInvoiceDetails } from "@/interfaces/payment/providers/StrikePaymentProvider";

enum INVOICE_STATUS {
    PAID = 'PAID',
    PENDING = 'PENDING',
    EXPIRED = 'EXPIRED',
}

export async function handleInvoiceWebhook(req: Request): Promise<void> {
    try {
        // The API sending the webhook expects a 200 response; otherwise, it will retry sending the webhook.
        console.log('[handleInvoiceWebhook]: Received invoice webhook. Validating...');
        const body = await req.json();
        const invoiceId = body?.data?.entityId;

        if (!invoiceId) {
            console.warn('[handleInvoiceWebhook]: WARNING: No entityId (invoiceId) in webhook request body. The request body is:', body);
            return;
        }

        if (!body.eventType || body.eventType !== 'invoice.updated') return;

        const invoiceDetails = await getStrikeInvoiceDetails(invoiceId);
        if (invoiceDetails.state !== INVOICE_STATUS.PAID) return;

        console.log("[handleInvoiceWebhook] Valid payment webhook received. Starting payment processing...");

        processPayment(invoiceId);

    } catch (error) {
        console.error(
            '[handleInvoiceWebhook] ERROR: There was a problem processing webhook request:',
            error
        );
    }
}
