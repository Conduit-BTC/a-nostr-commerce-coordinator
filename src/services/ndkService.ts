import { DEFAULT_RELAYS } from "@/utils/constants";
import NDK, { NDKPrivateKeySigner, NDKRelay, NDKRelaySet } from "@nostr-dev-kit/ndk";

export class NDKService {
    private static instance: NDKService | null = null;
    private ndk: NDK | null = null;

    // TODO: The "Home Relay" system is currently too-strongly centralized, which is against the ethos, and isn't yet resilient. This is a quick-and-dirty implementation. Create a better relay management system.

    private homeRelay: NDKRelay | null = null;
    private homeRelaySet: NDKRelaySet | null = null;
    private relayPool: NDKRelaySet | null = null;

    private constructor() {
        // Private constructor to prevent direct construction calls with 'new'
    }

    public static getInstance(): NDKService {
        if (!NDKService.instance) NDKService.instance = new NDKService();
        return NDKService.instance;
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

    public initialize(relayPool: string[]): Promise<NDK> {
        if (this.ndk) return Promise.resolve(this.ndk);

        if (!process.env.PRIVKEY) throw new Error("PRIVKEY not found in .env");

        const privkey = process.env.PRIVKEY;
        const signer = new NDKPrivateKeySigner(privkey);

        this.ndk = new NDK({
            explicitRelayUrls: relayPool,
            signer,
        });

        this.homeRelay = new NDKRelay(DEFAULT_RELAYS[0], undefined, this.ndk);
        this.homeRelaySet = new NDKRelaySet(new Set([this.homeRelay]), this.ndk)
        const relays: NDKRelay[] = [this.homeRelay];

        if (DEFAULT_RELAYS.length > 1) {
            for (let i = 1; i < DEFAULT_RELAYS.length; i++) {
                relays.push(new NDKRelay(DEFAULT_RELAYS[i], undefined, this.ndk));
            }
        }

        this.relayPool = new NDKRelaySet(new Set([this.homeRelay, ...relays]), this.ndk);

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 10000);

            const checkConnection = () => {
                const stats = this.ndk!.pool.stats();
                if (stats.connected > 0) {
                    clearTimeout(timeout);
                    resolve(this.ndk!);
                } else if (stats.disconnected === stats.total) {
                    clearTimeout(timeout);
                    reject(new Error('All relays disconnected'));
                }
            };

            this.ndk!.pool.on('relay:connect', (a) => {
                console.log(`[NDK] Connected to relay: ${a.url}`);
                checkConnection();
            });

            this.ndk!.pool.on('relay:disconnect', (relay) => {
                console.log(`[NDK] Disconnected from relay: ${relay.url}`);
            });

            this.ndk!.connect().catch(reject);
        });
    }

    // Method to reset the instance (mainly for testing purposes)
    public static reset(): void {
        NDKService.instance = null;
    }
}

export async function getNdk(relayPool: string[] = DEFAULT_RELAYS): Promise<NDK> {
    const service = NDKService.getInstance();
    return await service.initialize(relayPool);
}

export async function getHomeRelay(): Promise<NDKRelay> {
    const service = NDKService.getInstance();
    return service.getHomeRelay();
}

export async function getHomeRelaySet(): Promise<NDKRelaySet> {
    const service = NDKService.getInstance();
    return service.getHomeRelaySet();
}

export async function getRelayPool(): Promise<NDKRelaySet> {
    const service = NDKService.getInstance();
    return service.getRelayPool();
}
