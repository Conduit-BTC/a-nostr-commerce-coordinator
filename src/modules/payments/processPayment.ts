import getDb from '@/services/dbService'
import { DB_NAME, PAYMENT_STATUS } from '@/utils/constants'
import type { Transaction } from '@/types/types'
import { sendReceiptMessage } from '@/modules/direct-messages/directMessageUtils'
import { convertCurrency } from '@/utils/currencyConverter'

export async function processPayment(invoiceId: string): Promise<void> {
  console.log(
    `[processPayment]: Processing payment for invoice ${invoiceId}...`
  )

  // Get the order from the database using the invoiceId
  const response = await getTransactionFromInvoice(invoiceId)
  if (!response) {
    console.error(
      `[processPayment]: Transaction not found for invoice ${invoiceId}`
    )
    return
  }

  const { transaction, orderId } = response

  if (!transaction.payment) {
    console.error(
      `[processPayment]: Transaction not found for invoice ${invoiceId}`
    )
    return
  }

  console.log(
    `[processPayment]: Sending receipt for invoice ID ${invoiceId} to customer: ${transaction.customerPubkey}`
  )

  const amountInSats = await convertCurrency(transaction.payment.amount, 'USD')

  sendReceiptMessage({
    recipient: transaction.customerPubkey,
    orderId,
    amount: Math.round(amountInSats).toString(),
    lnInvoice: transaction.payment.details.lightningInvoice,
    lnPaymentHash: transaction.payment.details.invoiceId
  })

  transaction.timeline.paid_at = Date.now()
  transaction.payment!.status = PAYMENT_STATUS.PAID

  console.log(`[processPayment]: Updating transaction in the database..`)
  getDb().openDB({ name: DB_NAME.PROCESSING_ORDERS }).put(orderId, transaction)

  // TODO: Send this order to the Fulfillment queue
}

function getTransactionFromInvoice(
  invoiceId: string
): Promise<{ transaction: Transaction; orderId: string } | null> {
  const orderId = getDb()
    .openDB({ name: DB_NAME.PROCESSING_ORDERS_INVOICE_ID_INDEX })
    .get(invoiceId)
  if (!orderId) Promise.resolve(null)
  const transaction = getDb()
    .openDB({ name: DB_NAME.PROCESSING_ORDERS })
    .get(orderId)
  if (!transaction) Promise.resolve(null)

  return Promise.resolve({ transaction, orderId })
}
