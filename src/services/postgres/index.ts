import type { ZodSchema } from 'zod'
import type {
  NCCPersistence,
  NCCPersistenceFactory
} from '@/core/base-classes/NCCPersistence'

export const postgresPersistenceFactory: NCCPersistenceFactory = ({
  modelName,
  schema
}) => {
  return new PostgresPersistence(modelName, schema)
}

export class PostgresPersistence<T> implements NCCPersistence<T> {
  constructor(private modelName: string, private schema: ZodSchema<T>) {}

  async create(key: string, data: T): Promise<void> {
    this.schema.parse(data)
    // TODO: write to Postgres
  }

  async update(key: string, data: Partial<T>): Promise<void> {
    // TODO: update record in Postgres
  }

  async delete(key: string): Promise<void> {
    // TODO: delete from Postgres
  }

  async get(key: string): Promise<T | null> {
    // TODO: query from Postgres
    return null
  }

  async list(): Promise<T[]> {
    // TODO: query all from Postgres
    return []
  }
}
