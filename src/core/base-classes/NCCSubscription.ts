import type { NCCEventName } from '@/events/NCCEvents'

export abstract class NCCSubscription {
  protected container: NCCAppContainer

  constructor(container: NCCAppContainer) {
    this.container = container
  }

  protected getModule<T extends NCCModule>(name: string): T {
    return this.container.modules[name] as T
  }
  abstract subscribe(): void

  static eventNames(): NCCEventName[] {
    return []
  }
}
