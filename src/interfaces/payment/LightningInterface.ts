import { generateInvoice } from "./providers/StrikePaymentProvider";

export type GenerateInvoiceResponse = {
    success: boolean;
    message?: string;
    lightningInvoice?: string;
}

export async function createInvoice(orderId: string, amountInSats: number): Promise<GenerateInvoiceResponse> {
    return await generateInvoice(orderId, amountInSats);
}
