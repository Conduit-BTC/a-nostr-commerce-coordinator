import type NCCService from '../core/base-classes/NCCService'

export function defineModule<T extends NCCService<T>>(args: {
  name: string
  container: NCCModuleContainer<T>
  loaders?: NCCLoader[]
  lazyLoaders?: NCCLoader[]
  models?: NCCModels[]
}): NCCModule {
  return {
    name: args.name,
    container: args.container,
    loaders: args.loaders || [],
    lazyLoaders: args.lazyLoaders || [],
    models: args.models || []
  }
}
