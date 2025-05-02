import { getNdk } from '@/services/ndkService'
import { NDKEvent } from '@nostr-dev-kit/ndk'
import { merchantMessagesFilter } from '@/utils/constants'
import { getQueue } from '@/queues/Queue'
import { shouldIgnoreEvent } from '@/utils/shouldIgnoreEvent'
import { QUEUE_NAME } from '@/utils/constants'

const DirectMessages = {
  init: async () => await subscribe()
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

  subscription.on('event', async (event: NDKEvent) => {
    console.log(
      `[DirectMessages.subscribe]: Received NIP-17 encrypted message: ${event.id}`
    )
    // When the subscription starts, it will fetch all NIP-17 events for the Merchant npub across the Relay Pool, check them against a list of known irrelevant event IDs, as well as a list of already-processed orders. If the event ID is unique, then it will be added to the queue for processing.

    console.log(
      `[DirectMessages.subscribe]: Checking if event is explicitly ignored...`
    )
    if (shouldIgnoreEvent(event.id)) return

    console.log(
      `[DirectMessages.subscribe]: Adding direct message to queue: ${event.id}`
    )
    getQueue(QUEUE_NAME.DIRECT_MESSAGES).push(event.rawEvent()) // Handled via dmEventHandler
  })
}
