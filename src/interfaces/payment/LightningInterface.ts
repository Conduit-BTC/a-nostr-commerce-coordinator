import type { CreateInvoiceResponse } from "@/types/types";
import { generateInvoice } from "./providers/StrikePaymentProvider";

export async function createInvoice(orderId: string, amountInSats: number): Promise<CreateInvoiceResponse> {
    return await generateInvoice(orderId, amountInSats);
}
