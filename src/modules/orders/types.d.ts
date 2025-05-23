import type OrdersService from './service'
import type OrdersModule from './index'

export interface OrdersModule extends NCCModule {
  container: OrdersModuleContainer<OrdersService>
}

export interface OrdersModuleContainer
  extends NCCModuleContainer<OrdersService> {}
