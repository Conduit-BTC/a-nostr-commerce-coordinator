import { pubkey } from '@/utils/constants'
import getDb from '@/services/dbService'
import { getNdk } from '@/services/ndkService'
import { DB_NAME } from '@/utils/constants'
import {
  ProductListingUtils,
  ShippingOptionUtils,
  type ProductListing,
  type ShippingOption
} from 'nostr-commerce-schema'

export default async function synchronizeShippingOptions() {
  console.log('[synchronizeShippingOptions]: Synchronizing shipping options...')

  const ndk = await getNdk()

  const productsDb = getDb().openDB({ name: DB_NAME.PRODUCTS })
  const shippingOptionsDb = getDb().openDB({ name: DB_NAME.SHIPPING_OPTIONS })

  console.log(
    '[synchronizeShippingOptions]: Clearing out the shipping option events database...'
  )
  shippingOptionsDb.clearSync() // Clear out the DB, get ready for a fresh sync
  console.log(
    '[synchronizeShippingOptions]: Shipping option events database cleared'
  )

  const referenceStrings = [
    ...productsDb
      .getRange()
      .flatMap(({ value }: { value: ProductListing }) =>
        ProductListingUtils.getProductShippingOptions(value).map(
          ({ reference }) => reference
        )
      )
  ]

  referenceStrings.forEach(async (ref: string) => {
    const id = ref.split(':')[2]
    if (!id) {
      console.error(
        '[synchronizeShippingOptions]: Malformed ShippingOption: ',
        ref
      )
      return
    }
    const event = await ShippingOptionUtils.fetchShippingOptionEvent(
      id,
      pubkey!,
      ndk
    )
    if (!event) return
    const dTagId = ShippingOptionUtils.getShippingOptionId(
      event!.rawEvent() as unknown as ShippingOption
    )
    await shippingOptionsDb.put(
      `nostr-shipping-option-event:${dTagId}`,
      event.rawEvent()
    )
  })

  console.log(
    '[synchronizeShippingOptions]: Initial shipping options sync complete!'
  )
}
