import NCCService from '@/core/base-classes/NCCService'
import type { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk'
import {
  validateOrder as NCSValidateOrder,
  OrderUtils,
  type Order
} from 'nostr-commerce-schema'
import type { OrdersModule } from '.'

export default class OrdersService extends NCCService<
  OrdersService,
  OrdersModule
> {
  async create(orderEvent: NostrEvent): Promise<void> {
    const result = await this.validate(orderEvent)

    if (!result.success) {
      throw new Error('Order is invalid')
    }

    const orderId = OrderUtils.getOrderId(orderEvent as unknown as Order)

    await this.module.persistence.order.create(orderId!, {
      ...result.data,
      event: orderEvent
    })
  }

  async get(orderId: string) {
    return this.module.persistence.order.get(orderId)
  }

  async list() {
    return this.module.persistence.order.list()
  }

  async validate(order: NostrEvent) {
    return NCSValidateOrder(order)
  }

  async reject({
    ndkEvent,
    orderEvent,
    reason
  }: {
    ndkEvent: NDKEvent
    orderEvent: NostrEvent
    reason: string
  }) {
    console.log('Rejected event with ID: ', ndkEvent.id)
    // Save the rejected order
    // Emit an event to notify the merchant
    // Emit event that sends rejection DM to customer, with shouldFollowUp considered
  }
}
