import OrdersService from './service'
import { defineModule } from '@/modules/define-module'
import type { OrdersModule, OrdersModuleContainer } from './types'

export const OrdersModuleName = 'orders-module'

type OrdersModuleFactoryArgs = {
  container: OrdersModuleContainer
  loaders?: NCCLoader<OrdersService>[]
  lazyLoaders?: NCCLoader<OrdersService>[]
}

export default function createOrdersModule({
  container,
  loaders,
  lazyLoaders
}: OrdersModuleFactoryArgs): OrdersModule {
  return defineModule({
    name: OrdersModuleName,
    container,
    loaders,
    lazyLoaders
  })
}
