import type NCCService from '@/core/base-classes/NCCService'
import type Config from '@/config'
import type { EventBus } from '@/events/NCCEventBus'

declare global {
  interface NCCModule<TService = NCCService> {
    name: string
    container: NCCModuleContainer<TService>
    loaders?: NCCLoader[]
    lazyLoaders?: NCCLoader[]
  }

  type NCCLoader<TService = NCCService> = (args: {
    container: NCCModuleContainer<TService>
  }) => Promise<void>

  interface NCCModuleContainer<TService> {
    config: typeof Config
    eventBus: typeof EventBus
    models: Record<string, any>
    service: TService
  }

  interface NCCAppContainer {
    modules: Record<string, NCCModule>
    eventBus: typeof EventBus
  }
}
