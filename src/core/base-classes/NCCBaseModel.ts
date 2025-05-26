import type { z, ZodObject, ZodRawShape } from 'zod'

export abstract class NCCBaseModel<T extends ZodObject<ZodRawShape>> {
  protected readonly schema: T

  constructor(schema: T) {
    this.schema = schema
  }

  /**
   * Validate and return the parsed object, or throw.
   */
  validate(data: unknown): z.infer<T> {
    return this.schema.parse(data)
  }

  /**
   * Check if the provided value is valid, but do not throw.
   */
  isValid(data: unknown): boolean {
    return this.schema.safeParse(data).success
  }
}
