import { generateInvoice } from "./providers/StrikePaymentProvider";

export type CreateInvoiceResponse = {
    success: boolean;
    message?: string;
    lightningInvoice?: string;
}

export async function createInvoice(orderId: string, amountInSats: number): Promise<CreateInvoiceResponse> {
    return await generateInvoice(orderId, amountInSats);
}
