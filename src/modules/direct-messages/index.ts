import { getNdk } from '@/services/ndkService'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { merchantMessagesFilter } from '@/utils/constants'
import { getQueue } from '@/modules/queues/Queue'
import { shouldIgnoreEvent } from '@/utils/shouldIgnoreEvent'
import { QUEUE_NAME } from '@/utils/constants'

const DirectMessages = {
  subscribe: async () => {
    await subscribe()
  }
} as const

export default DirectMessages

async function subscribe() {
  console.log(
    `[DirectMessages.subscribe]: Listening to Relay Pool for NIP-17 DMs addressed to ${process.env.PUBKEY}...`
  )

  // Set up subscription filter for NIP-17 DMs
  const filter = merchantMessagesFilter

  const ndk = await getNdk()
  const subscription = ndk.subscribe(filter, { closeOnEose: false })

  subscription.on('event', async (event: NDKEvent) =>
    subscriptionHandler(event)
  )
}

function subscriptionHandler(event: NDKEvent): void {
  console.log(
    `[DirectMessages.subscribe]: Received NIP-17 encrypted message: ${event.id}`
  )

  if (shouldIgnoreEvent(event.id)) return

  console.log(
    `[DirectMessages.subscribe]: Adding new direct message to queue: ${event.id}`
  )
  getQueue(QUEUE_NAME.DIRECT_MESSAGES).push(event.rawEvent()) // Handled via dmEventHandler
}
