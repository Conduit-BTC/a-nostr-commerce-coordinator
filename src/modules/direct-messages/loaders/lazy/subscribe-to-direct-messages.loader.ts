import { pubkey } from '@/constants'
import { NESubscription } from '@/services/nostr/NESubscription'
import type { NDKEvent } from '@nostr-dev-kit/ndk'
import type DirectMessagesService from '../../service'

export default async function subscribeToDirectMessagesLoader({
  container
}: {
  container: NCCModuleContainer<DirectMessagesService>
}) {
  const filter = { kinds: [1059], '#p': [pubkey!] }
  const options = { closeOnEose: false } // Long-running subscription
  const nostrService = container.config.NostrService

  const sub = new NESubscription({ nostrService, filter, options })

  const service = container.service as DirectMessagesService

  sub.on('event', async (event: NDKEvent) => {
    const rumor = await service.decrypt({ event })
    service.route({ event, rumor })
  })
}
