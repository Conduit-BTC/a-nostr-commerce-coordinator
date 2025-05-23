import { pubkey } from '@/constants'
import { NESubscription } from '@/services/nostr/NESubscription'
import type { NDKEvent } from '@nostr-dev-kit/ndk'
import type DirectMessagesService from '../../service'

export default async function subscribeToDirectMessagesLoader({
  container
}: {
  container: NCCModuleContainer<DirectMessagesService>
}) {
  const ndk = container.config.NostrService.getNDK()
  const filter = { kinds: [1059], '#p': [pubkey!] }
  const options = { closeOnEose: false } // Long-running subscription
  const service = container.service as DirectMessagesService

  const sub = new NESubscription({ ndk, filter, options })

  sub.on('event', async (event: NDKEvent) => {
    // TODO: Add to ignored events {eventId, reason: "PREVIOUSLY_HANDLED"}

    const rumor = await service.decrypt({ event })
    service.route({ event, rumor })
  })
}
