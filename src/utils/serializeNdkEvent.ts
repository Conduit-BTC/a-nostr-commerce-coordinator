import type { NDKEvent, NostrEvent } from "@nostr-dev-kit/ndk";

export default function serializeNDKEvent(event: NDKEvent): NostrEvent {
    return {
        id: event.id,
        pubkey: event.pubkey,
        created_at: event.created_at!,
        kind: event.kind,
        content: event.content,
        tags: event.tags,
        sig: event.sig
    };
}
