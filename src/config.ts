import { Defaults } from './constants'
import { createNostrService } from './services/nostr/NostrService'

const relayPool = Defaults.RELAYS

const Config = {
  relayPool,
  NostrService: await createNostrService(relayPool)
} as const

export default Config
