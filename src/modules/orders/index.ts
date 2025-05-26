import { OrderSchema } from './models/order'
import OrdersService from './service'
import { NCCBaseModule } from '@/core/base-classes/NCCBaseModule'
import type { OrdersModuleContainer } from './types'
import type { NCCPersistence } from '@/core/base-classes/NCCPersistence'
import type { z } from 'zod'

export const ModuleName = 'orders-module'

export const OrderSchemas = {
  order: OrderSchema
}
export type OrderSchemas = typeof OrderSchemas
export type OrderModels = {
  [K in keyof OrderSchemas]: z.infer<OrderSchemas[K]>
}

export class OrdersModule extends NCCBaseModule<
  typeof OrderSchemas,
  OrdersService
> {
  static moduleName = ModuleName

  constructor(args: {
    container: OrdersModuleContainer
    persistence: {
      [K in keyof OrderModels]: NCCPersistence<OrderModels[K]>
    }
  }) {
    super({
      name: ModuleName,
      container: args.container,
      persistence: args.persistence
    })
  }
}

type OrdersModuleFactoryArgs = {
  container: OrdersModuleContainer
  loaders?: NCCLoader<OrdersService>[]
  lazyLoaders?: NCCLoader<OrdersService>[]
}

export default function createModule({
  container,
  persistence
}: OrdersModuleFactoryArgs & {
  persistence: {
    [K in keyof OrderModels]: NCCPersistence<OrderModels[K]>
  }
}): OrdersModule {
  return new OrdersModule({ container, persistence })
}
