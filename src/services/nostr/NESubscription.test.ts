import { describe, expect, it, spyOn } from 'bun:test'
import type { NDKSubscription } from '@nostr-dev-kit/ndk'
import type NDK from '@nostr-dev-kit/ndk'
import type { NostrService } from './NostrService'

describe('NESubscription', () => {
  it('subscribes with the provided filter and options', () => {
    const fakeSubscription = {
      on: () => {}
    } as unknown as NDKSubscription

    const ndk = {
      subscribe: () => fakeSubscription
    } as unknown as NDK

    const nostrService = {
      getNDK: () => ndk,
      createSubscriber: () => fakeSubscription
    } as unknown as NostrService

    const subscribeSpy = spyOn(nostrService, 'createSubscriber')

    const filter = { kinds: [1], authors: ['pubkey'] }
    const options = { closeOnEose: true }

    const sub = nostrService.createSubscriber({ filter, options })

    expect(subscribeSpy).toHaveBeenCalledWith({ filter, options })
  })

  it('attaches event listeners to the subscription', () => {
    const onSpy = function () {} as unknown as NDKSubscription['on']

    const fakeSubscription = {
      on: onSpy
    } as unknown as NDKSubscription

    const onSpyReal = spyOn(fakeSubscription, 'on')

    const ndk = {
      subscribe: () => fakeSubscription
    } as unknown as NDK

    const nostrService = {
      getNDK: () => ndk,
      createSubscriber: () => fakeSubscription
    } as unknown as NostrService

    const subscribeSpy = spyOn(nostrService, 'createSubscriber')

    const sub = nostrService.createSubscriber({ filter: { kinds: [1] } })

    const eventListener = () => {}
    const eoseListener = () => {}

    sub.on('event', eventListener)
    sub.on('eose', eoseListener)

    expect(onSpyReal).toHaveBeenCalledWith('event', eventListener)
    expect(onSpyReal).toHaveBeenCalledWith('eose', eoseListener)
  })
})
