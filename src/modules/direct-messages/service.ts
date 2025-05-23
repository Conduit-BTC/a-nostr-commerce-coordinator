import { privkey } from '@/constants'
import NCCService from '@/core/base-classes/NCCService'
import { EventNames } from '@/events/NCCEvents'
import {
  NDKEvent,
  NDKPrivateKeySigner,
  NDKUser,
  type NostrEvent
} from '@nostr-dev-kit/ndk'

type DecryptParams = {
  event: NDKEvent
}

type RouteParams = {
  event: NDKEvent
  rumor: NostrEvent
}

export default class DirectMessagesService extends NCCService<DirectMessagesService> {
  /**
   * Receives a NIP-17 DM, decrypts it, and returns the rumor
   * @param { NDKEvent }
   */
  async decrypt({ event }: DecryptParams): Promise<NostrEvent> {
    console.log(
      '[DirectMessageService.decrypt] > Decrypting DM - ID: ',
      event.id
    )

    const signer = new NDKPrivateKeySigner(privkey)

    const seal: string = await signer.decrypt(
      new NDKUser({ pubkey: event.pubkey }),
      event.content
    )
    const sealJson = JSON.parse(seal)
    const rumor: string = await signer.decrypt(
      new NDKUser({ pubkey: sealJson.pubkey }),
      sealJson.content
    )
    return JSON.parse(rumor)
  }

  /**
   * Receives a NIP-17 "Rumor" and emits an event corresponding to its handler
   * @param { NostrEvent }
   */
  async route({ event, rumor }: RouteParams) {
    const { eventBus } = this.container

    switch (rumor.kind) {
      // Regular communications
      case 14:
        eventBus.emit(EventNames.NOSTR_DM_RECEIVED, { event, rumor })
        break

      // Order processing and status
      case 16:
        eventBus.emit(EventNames.ORDER_REQUEST_RECEIVED, {
          event,
          order: rumor
        })
        break

      // All other kinds are irrelevant to the Coordinator
      default:
        break
    }
  }
}
