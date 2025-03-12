import type { Transaction } from "@/types/types";

export async function processPayment(invoiceId: string): Promise<void> {
    console.log(`[processPayment]: Processing payment for invoice ${invoiceId}...`);

    // Get the order from the database using the invoiceId
    const transaction = await getTransactionFromInvoice(invoiceId);
}

function getTransactionFromInvoice(invoiceId: string): Promise<Transaction> {

}
