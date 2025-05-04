import { QUEUE_NAME } from '@/utils/constants'
import { dmQueueEventHandler } from './handlers/dmEventHandler'
import { orderEventHandler } from './handlers/orderEventHandler'
import { Queue, QueueRegistry } from './Queue'
import type { NostrEvent } from 'nostr-tools'
import type { Order } from 'nostr-commerce-schema'

const Queues = {
  init: () => init()
} as const

export default Queues

export const dmQueueConfig = {
  name: QUEUE_NAME.DIRECT_MESSAGES,
  handler: dmQueueEventHandler
}

export const orderQueueConfig = {
  name: QUEUE_NAME.ORDERS,
  handler: orderEventHandler
}

function init() {
  console.log('\n----------------------------------------')
  console.log('[startup]: Initializing Direct Message Queue...\n\n')
  QueueRegistry.set(
    dmQueueConfig.name,
    new Queue<NostrEvent>(dmQueueConfig.name, dmQueueConfig.handler)
  )
  console.log(`Queue initialized: ${dmQueueConfig.name}`)

  console.log('[startup]: Initializing Order Processing Queue...\n\n')
  QueueRegistry.set(
    orderQueueConfig.name,
    new Queue<{ order: Order; customerPubkey: string }>(
      orderQueueConfig.name,
      orderQueueConfig.handler
    )
  )
  console.log(`Queue initialized: ${orderQueueConfig.name}`)

  console.log('----------------------------------------\n')
}
