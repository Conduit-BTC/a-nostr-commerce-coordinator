import type { CreateInvoiceResponse } from '@/types/types'
import { generateInvoice } from './providers/StrikePaymentProvider'

export async function createInvoice(
  orderId: string,
  priceObj: { amount: number; currency: string }
): Promise<CreateInvoiceResponse> {
  return await generateInvoice(orderId, priceObj)
}
