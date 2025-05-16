import NDK, {
  NDKPrivateKeySigner,
  NDKRelay,
  NDKRelaySet,
  type NDKFilter,
} from "@nostr-dev-kit/ndk";
import { NESubscription } from "./NESubscription";

export async function createNostrService(
  relayPool: string[]
): Promise<NostrService> {
  const service = NostrService.getInstance();
  await service.initialize(relayPool);
  return service;
}

class NostrService {
  private static instance: NostrService | null = null;
  private ndk: NDK | null = null;

  private homeRelay: NDKRelay | null = null;
  private homeRelaySet: NDKRelaySet | null = null;
  private relayPool: NDKRelaySet | null = null;

  private constructor() {
    // Private constructor to prevent direct construction calls with 'new'
  }

  public static getInstance(): NostrService {
    if (!NostrService.instance) NostrService.instance = new NostrService();
    return NostrService.instance;
  }

  public getNDK(): NDK {
    if (!this.ndk) throw new Error("NDK not initialized");
    return this.ndk;
  }

  public getHomeRelay(): NDKRelay {
    if (!this.homeRelay) throw new Error("Home relay not initialized");
    return this.homeRelay;
  }

  public getHomeRelaySet(): NDKRelaySet {
    if (!this.homeRelaySet) throw new Error("Home relay set not initialized");
    return this.homeRelaySet;
  }

  public getRelayPool(): NDKRelaySet {
    if (!this.relayPool) throw new Error("Relay pool not initialized");
    return this.relayPool;
  }

  public emitEvent() {}
  public encryptEvent() {}
  public decryptEvent() {}
  public signEvent() {}

  public createSubscriber({
    filter,
    options,
  }: {
    filter: NDKFilter;
    options?: NESubscriptionOptions;
  }) {
    if (!this.ndk) throw new Error("NDK not initialized");
    return new NESubscription({ ndk: this.ndk!, filter, options });
  }

  // Method to reset the instance (mainly for testing purposes)
  public static reset(): void {
    NostrService.instance = null;
  }

  public initialize(relayPool: string[]): Promise<NDK> {
    if (this.ndk) return Promise.resolve(this.ndk);

    if (!process.env.PRIVKEY) throw new Error("PRIVKEY not found in .env");

    const privkey = process.env.PRIVKEY;
    const signer = new NDKPrivateKeySigner(privkey);

    this.ndk = new NDK({
      explicitRelayUrls: relayPool,
      signer,
    });

    this.homeRelay = new NDKRelay(relayPool[0], undefined, this.ndk);
    this.homeRelaySet = new NDKRelaySet(new Set([this.homeRelay]), this.ndk);
    const relays: NDKRelay[] = [this.homeRelay];

    if (relayPool.length > 1) {
      for (let i = 1; i < relayPool.length; i++) {
        relays.push(new NDKRelay(relayPool[i], undefined, this.ndk));
      }
    }

    this.relayPool = new NDKRelaySet(
      new Set([this.homeRelay, ...relays]),
      this.ndk
    );

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(console.warn("NDK: Connection timeout"));
      }, 10000);

      const checkConnection = () => {
        const stats = this.ndk!.pool.stats();
        if (stats.connected > 0) {
          clearTimeout(timeout);
          resolve(this.ndk!);
        } else if (stats.disconnected === stats.total) {
          clearTimeout(timeout);
          reject(new Error("All relays disconnected"));
        }
      };

      this.ndk!.pool.on("relay:connect", (a) => {
        console.log(`[NDK] Connected to relay: ${a.url}`);
        checkConnection();
      });

      this.ndk!.pool.on("relay:disconnect", (relay) => {
        console.log(`[NDK] Disconnected from relay: ${relay.url}`);
      });

      this.ndk!.connect().catch(reject);
    });
  }
}
