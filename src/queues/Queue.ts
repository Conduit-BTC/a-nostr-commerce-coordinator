export interface QueueItem<T> {
  id: string
  data: T
  messages?: string[]
}

export const QueueRegistry = new Map<string, Queue<any>>()

export function getQueue(key: string): Queue<any> {
  const queue = QueueRegistry.get(key)
  if (!queue) {
    throw new Error(`No queue found for key: ${key}`)
  }
  return queue
}

export class Queue<T> {
  public name: string | null = null
  private queue: QueueItem<T>[] = []
  private inFlightItems: Map<string, QueueItem<T>> = new Map()
  private processing: boolean = false
  private processHandler: (item: QueueItem<T>) => void

  constructor(name: string, processHandler: (item: QueueItem<T>) => void) {
    this.processHandler = processHandler
    QueueRegistry.set(name, this)
  }

  push(data: T, messages?: any): void {
    const queueItem: QueueItem<T> = {
      id: crypto.randomUUID(),
      data,
      messages: messages ?? []
    }
    this.queue.push(queueItem)
    this.processQueue()
  }

  private processQueue(): void {
    if (this.processing || this.queue.length === 0) return
    this.processing = true
    try {
      while (this.queue.length > 0) {
        const item: QueueItem<T> = this.queue[0]
        try {
          this.inFlightItems.set(item.id, item)
          this.queue.shift()
          this.processHandler(item)
        } catch (error) {
          console.error(`Error processing item: ${error}`)
          break
        }
      }
    } finally {
      this.processing = false
    }
    if (this.queue.length > 0) {
      this.processQueue()
    }
  }

  public confirmProcessed(itemId: string): void {
    if (!this.inFlightItems.delete(itemId)) {
      console.warn(
        `Attempted to confirm item ${itemId} but it was not found in in-flight items`
      )
    }
  }

  public requeueItem(itemId: string): void {
    const item = this.inFlightItems.get(itemId)
    if (item) {
      this.queue.push(item)
      this.inFlightItems.delete(itemId)
      console.info(`Item ${itemId} requeued`)
      this.processQueue()
    } else {
      console.warn(
        `Attempted to requeue item ${itemId} but it was not found in in-flight items`
      )
    }
  }

  public getAllItems(): QueueItem<T>[] {
    return this.queue
  }
}
