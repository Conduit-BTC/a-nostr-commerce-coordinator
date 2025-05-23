import { NCCSubscription } from '@/core/base-classes/NCCSubscription'
import { EventBus } from '@/events/NCCEventBus'
import { EventNames } from '@/events/NCCEvents'

export default class NostrDMReceivedSubscription extends NCCSubscription {
  subscribe() {
    EventBus.on(EventNames.NOSTR_DM_RECEIVED, (payload) => {
      console.log(
        `EVENT: [${
          EventNames.NOSTR_DM_RECEIVED
        }] > SUBSCRIBER: [NostrDMReceivedSubscription] > PAYLOAD: ${JSON.stringify(
          payload
        )}`
      )
    })
  }

  static override eventNames() {
    return [EventNames.NOSTR_DM_RECEIVED]
  }
}
