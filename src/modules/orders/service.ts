import NCCService from '@/core/base-classes/NCCService'
import type { NDKEvent, NostrEvent } from '@nostr-dev-kit/ndk'
import { validateOrder as NCSValidateOrder } from 'nostr-commerce-schema'

export default class OrdersService extends NCCService<OrdersService> {
  async validate(order: NostrEvent) {
    return NCSValidateOrder(order)
  }

  async reject({ event, order }: { event: NDKEvent; order: NostrEvent }) {
    console.log('Rejected event with ID: ', event.id)
  }
}
