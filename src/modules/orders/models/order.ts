import type { Order as NostrOrderEvent } from 'nostr-commerce-schema'
import {
  SIZE_UNIT,
  WEIGHT_UNIT,
  CHECKOUT_ERROR,
  ORDER_STATUS
} from '@/constants'
import { z } from 'zod'
import { NCCBaseModel } from '@/core/base-classes/NCCBaseModel'

const SizeUnitEnum = z.enum(Object.values(SIZE_UNIT) as [string, ...string[]])
const WeightUnitEnum = z.enum(
  Object.values(WEIGHT_UNIT) as [string, ...string[]]
)
const OrderStatusEnum = z.enum(
  Object.values(ORDER_STATUS) as [string, ...string[]]
)
const CheckoutErrorEnum = z.enum(
  Object.values(CHECKOUT_ERROR) as [string, ...string[]]
)

/**
 * Representation of an Order in the NCC system
 */
export const OrderSchema = z.object({
  orderId: z.string(),
  dmEventId: z.string(),
  customerPubkey: z.string(),
  event: z.custom<NostrOrderEvent>(),
  items: z.array(
    z.object({
      productListingId: z.string().optional(),
      quantity: z.number().optional(),
      dimensions: z
        .object({
          sizeUnit: SizeUnitEnum,
          weightUnit: WeightUnitEnum,
          length: z.number().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
          weight: z.number().optional()
        })
        .optional(),
      pricePerItem: z
        .object({
          amount: z.string(),
          currency: z.string(),
          frequency: z.string().optional()
        })
        .optional(),
      error: CheckoutErrorEnum.optional(),
      message: z.string().optional()
    })
  ),
  status: OrderStatusEnum,
  totalPrice: z.object({
    amount: z.number(),
    currency: z.string()
  }),
  timeline: z.object({
    created_at: z.number(),
    paid_at: z.number().optional(),
    shipped_at: z.number().optional(),
    delivered_at: z.number().optional(),
    cancelled_at: z.number().optional()
  }),
  paymentReferenceId: z.string().optional(),
  shippingReferenceId: z.string().optional()
})

export class OrderModel extends NCCBaseModel<typeof OrderSchema> {
  constructor() {
    super(OrderSchema)
  }
}
