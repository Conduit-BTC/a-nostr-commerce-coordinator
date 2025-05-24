import NCCService from '@/core/base-classes/NCCService'
import type { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk'
import { validateOrder as NCSValidateOrder } from 'nostr-commerce-schema'

export default class OrdersService extends NCCService<OrdersService> {
  async create(order: NostrEvent) {}

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
