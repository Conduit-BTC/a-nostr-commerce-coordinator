import type NCCService from '@/core/base-classes/NCCService'
import type Config from '@/config'
import type { EventBus } from '@/events/NCCEventBus'
import type { NCCPersistence } from './base-classes/NCCPersistence'

declare global {
  interface NCCModule<
    TService = NCCService<any>,
    TSchemas extends SchemaMap = SchemaMap
  > {
    name: string
    container: NCCModuleContainer<TService>
    persistence: NCCPersistenceMap<TSchemas>
    loaders?: NCCLoader[]
    lazyLoaders?: NCCLoader[]
    models?: NCCModels[]
  }

  type NCCLoader<TService = NCCService> = (args: {
    container: NCCModuleContainer<TService>
  }) => Promise<void>

  interface NCCModuleContainer<TService> {
    config: typeof Config
    eventBus: typeof EventBus
    models: Record<string, any>
    service: TService
    module: NCCModule<TService>
  }

  interface NCCAppContainer {
    modules: Record<string, NCCModule>
    eventBus: typeof EventBus
  }
}
