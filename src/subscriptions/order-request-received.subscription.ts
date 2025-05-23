import { NCCSubscription } from '@/core/base-classes/NCCSubscription'
import { EventBus } from '@/events/NCCEventBus'
import { EventNames } from '@/events/NCCEvents'
import { OrdersModuleName } from '@/modules/orders'
import type OrdersService from '@/modules/orders/service'
import type { OrdersModule } from '@/modules/orders/types'

export default class OrderRequestReceivedSubscription extends NCCSubscription {
  constructor(container: NCCAppContainer) {
    console.log('Container: ', Object.keys(container))
    super(container)
  }

  subscribe() {
    const {
      container: { eventBus, service: orderService }
    } = this.getModule<OrdersModule>(OrdersModuleName) as {
      container: {
        eventBus: typeof EventBus
        service: OrdersService
      }
    }

    EventBus.on(EventNames.ORDER_REQUEST_RECEIVED, async ({ event, order }) => {
      const validatedOrder = await orderService.validate(order)

      if (!validatedOrder.success) {
        // TODO: Instead of rejecting non-spec orders, move the Order to a manual flow where the Merchant can review the order and decide whether to accept or reject it.
        console.log('Invalid order')
        orderService.reject({ event, order })
        return
      }

      // Create transaction
      // Save transaction with CREATED status
      // Generate Payment Request
      // Send Payment Request
      // Update transaction with PENDING_PAYMENT status and payment information
    })
  }

  static override eventNames() {
    return [EventNames.ORDER_REQUEST_RECEIVED]
  }
}
