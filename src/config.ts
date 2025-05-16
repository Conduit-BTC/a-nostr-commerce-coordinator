import { Defaults } from "./constants";
import { createNostrService } from "./services/nostr/NostrService";

const relayPool = Defaults.RELAYS;

const Config = {
  relayPool,
  NostrService: createNostrService(relayPool),
} as const;

export default Config;
