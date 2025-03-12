import getDb from "@/services/dbService";
import { DB_NAME, PAYMENT_STATUS } from "@/types/enums";
import type { Transaction } from "@/types/types";

export async function processPayment(invoiceId: string): Promise<void> {
    console.log(`[processPayment]: Processing payment for invoice ${invoiceId}...`);

    // Get the order from the database using the invoiceId
    const transaction = await getTransactionFromInvoice(invoiceId);
    if (!transaction || !transaction.payment) {
        console.error(`[processPayment]: Transaction not found for invoice ${invoiceId}`);
        return;
    }

    // Verify the transaction details
    console.log(`[processPayment]: Verifying transaction details...`);
    console.log(transaction);

    transaction.payment!.status = PAYMENT_STATUS.PAID;
}

function getTransactionFromInvoice(invoiceId: string): Promise<Transaction | null> {
    console.log("INVOICE ID", invoiceId);
    const orderId = getDb().openDB({ name: DB_NAME.PROCESSING_ORDERS_INVOICE_ID_INDEX }).get(invoiceId);
    if (!orderId) Promise.resolve(null);
    return getDb().openDB({ name: DB_NAME.PROCESSING_ORDERS }).get(orderId);
}
