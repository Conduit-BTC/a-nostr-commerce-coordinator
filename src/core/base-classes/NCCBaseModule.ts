import type { z, ZodSchema } from 'zod'
import type { NCCPersistence, NCCPersistenceFactory } from './NCCPersistence'
import type NCCService from './NCCService'

// Map of schema names to their Zod definitions
type SchemaMap = Record<string, ZodSchema<any>>

// Infer actual TypeScript types from Zod schemas
type InferModelTypes<T extends SchemaMap> = {
  [K in keyof T]: z.infer<T[K]>
}

// Persistence map from model name to typed persistence
type NCCPersistenceMap<TSchemas extends SchemaMap> = {
  [K in keyof TSchemas]: NCCPersistence<z.infer<TSchemas[K]>>
}

export interface NCCModuleArgs<
  TSchemas extends SchemaMap,
  TService extends NCCService<TService>
> {
  name: string
  container: NCCModuleContainer<TService>
  persistence: NCCPersistenceMap<TSchemas>
}

export abstract class NCCBaseModule<
  TSchemas extends SchemaMap,
  TService extends NCCService<TService>
> {
  public readonly name: string
  public readonly container: NCCModuleContainer<TService>
  public readonly persistence: NCCPersistenceMap<TSchemas>

  public loaders?: NCCLoader<TService>[]
  public lazyLoaders?: NCCLoader<TService>[]

  constructor(args: NCCModuleArgs<TSchemas, TService>) {
    this.name = args.name
    this.container = args.container
    this.persistence = args.persistence
  }
}
