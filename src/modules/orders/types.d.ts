import type OrdersService from './service'
import type OrdersModule from './index'

export interface OrdersModuleContainer
  extends NCCModuleContainer<OrdersService> {}
