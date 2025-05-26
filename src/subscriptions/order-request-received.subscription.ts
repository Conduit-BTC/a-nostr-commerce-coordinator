import { NCCSubscription } from '@/core/base-classes/NCCSubscription'
import type { EventBus } from '@/events/NCCEventBus'
import { EventNames } from '@/events/NCCEvents'
import { ModuleName } from '@/modules/orders'
import type OrdersService from '@/modules/orders/service'
import type { OrdersModule } from '@/modules/orders/types'

export default class OrderRequestReceivedSubscription extends NCCSubscription {
  constructor(container: NCCAppContainer) {
    super(container)
  }

  subscribe() {
    const {
      container: { eventBus, service: orderService }
    } = this.getModule<OrdersModule>(ModuleName) as {
      container: {
        eventBus: typeof EventBus
        service: OrdersService
      }
    }

    eventBus.on(
      EventNames.ORDER_REQUEST_RECEIVED,
      async ({ ndkEvent, orderEvent }) => {
        const orderValidationStatus = await orderService.validate(orderEvent)

        if (!orderValidationStatus.success) {
          console.log('Invalid order: ', ndkEvent.id)
          orderService.reject({
            ndkEvent,
            orderEvent,
            reason:
              JSON.stringify(orderValidationStatus.error) || 'Validation error'
          })
          return
        }

        console.log('Received order: ', orderEvent)

        // Create order object
        // Save order with CREATED status
        // Generate Payment Request
        // Send Payment Request
        // Update transaction with PENDING_PAYMENT status and payment information
      }
    )
  }

  static override eventNames() {
    return [EventNames.ORDER_REQUEST_RECEIVED]
  }
}
