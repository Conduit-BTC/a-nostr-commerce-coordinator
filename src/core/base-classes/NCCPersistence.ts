import type { z, ZodSchema } from 'zod'

export interface NCCPersistence<T> {
  create(key: string, data: T): Promise<void>
  update(key: string, data: Partial<T>): Promise<void>
  delete(key: string): Promise<void>
  get(key: string): Promise<T | null>
  list(): Promise<T[]>
}

export type NCCPersistenceFactory = <T extends ZodSchema<any>>(args: {
  dbPath: string
  moduleName: string
  modelName: string
  schema: T
}) => NCCPersistence<z.infer<T>>
