import NDK, { NDKPrivateKeySigner, type NDKFilter } from '@nostr-dev-kit/ndk'
import { NESubscription } from './NESubscription'

export async function createNostrService(
  relayPool: string[]
): Promise<NostrService> {
  const service = NostrService.getInstance()
  await service.initialize(relayPool)
  return service
}

export class NostrService {
  private static instance: NostrService | null = null
  private ndk: NDK | null = null

  private constructor() {
    // Private constructor to prevent direct construction calls with 'new'
  }

  public static getInstance(): NostrService {
    if (!NostrService.instance) NostrService.instance = new NostrService()
    return NostrService.instance
  }

  public getNDK(): NDK {
    if (!this.ndk) throw new Error('NDK not initialized')
    return this.ndk
  }

  public createSubscriber({
    filter,
    options
  }: {
    filter: NDKFilter
    options?: NESubscriptionOptions
  }) {
    if (!this.ndk) throw new Error('NDK not initialized')
    return new NESubscription({ nostrService: this, filter, options })
  }

  public initialize(relayPool: string[]): Promise<NDK> {
    if (this.ndk) return Promise.resolve(this.ndk)

    if (!process.env.PRIVKEY) throw new Error('PRIVKEY not found in .env')

    const privkey = process.env.PRIVKEY
    const signer = new NDKPrivateKeySigner(privkey)

    this.ndk = new NDK({
      explicitRelayUrls: relayPool,
      autoConnectUserRelays: false,
      signer
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(console.warn('NDK: Connection timeout'))
      }, 10000)

      const checkConnection = () => {
        const stats = this.ndk!.pool.stats()
        if (stats.connected > 0) {
          clearTimeout(timeout)
          resolve(this.ndk!)
        } else if (stats.disconnected === stats.total) {
          clearTimeout(timeout)
          reject(new Error('All relays disconnected'))
        }
      }

      this.ndk!.pool.on('relay:connect', (a) => {
        console.log(`[NDK] Connected to relay: ${a.url}`)
        checkConnection()
      })

      this.ndk!.pool.on('relay:disconnect', (relay) => {
        console.log(`[NDK] Disconnected from relay: ${relay.url}`)
      })

      this.ndk!.connect().catch(reject)
    })
  }
}
