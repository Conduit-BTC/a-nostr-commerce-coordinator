import getDb from '@/services/dbService'
import {
  validateProductListing,
  type ProductListing
} from 'nostr-commerce-schema'
import { getHomeRelaySet, getNdk, getRelayPool } from '@/services/ndkService'
import { DB_NAME, getMerchantSpecificProductFilter } from '@/utils/constants'
import type { NDKRelaySet } from '@nostr-dev-kit/ndk'

/*
 * Attempts to retrieve a single Product from the DB, fails over to the HomeRelay, finally to the RelayPool.
 */
export async function getProduct(
  productId: string
): Promise<ProductListing | null> {
  const productDb = getDb().openDB({ name: DB_NAME.PRODUCTS })
  const productFromDb = await productDb.get(`nostr-product-event:${productId}`)
  if (productFromDb) return productFromDb as ProductListing

  const productFromHomeRelay = await fetchProductFromRelaySet(
    await getHomeRelaySet(),
    productId
  )
  if (productFromHomeRelay) return productFromHomeRelay

  const productFromRelayPool = await fetchProductFromRelaySet(
    await getRelayPool(),
    productId
  )
  if (productFromRelayPool) return productFromRelayPool

  return null
}

export default async function fetchProductFromRelaySet(
  relaySet: NDKRelaySet,
  productId: string,
  timeoutMs = 1000
): Promise<ProductListing | null> {
  console.log(
    `[fetchProductFromRelaySet]: Fetching ${productId} from relay set...`
  )
  console.log(`[fetchProductFromRelaySet]: Relay set: ${relaySet.relayUrls}`)

  const ndk = await getNdk()
  const filter = getMerchantSpecificProductFilter(productId)
  const subscription = ndk.subscribe(filter, { closeOnEose: false }, relaySet)

  return new Promise<ProductListing | null>((resolve, reject) => {
    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) {
        console.warn(
          `[fetchProductFromRelaySet]: Product event for ${productId} timed out`
        )
        subscription.stop()
        resolve(null)
      }
    }, timeoutMs)

    subscription.on('event', async (event) => {
      if (resolved) return

      console.log(
        `[fetchProductFromRelaySet]: Received Product event from RelaySet: ${event.id}`
      )
      const product = event.rawEvent()

      if (validateProductListing(product)) {
        clearTimeout(timeout)
        resolved = true
        subscription.stop()
        resolve(product as unknown as ProductListing)
      }
      console.warn(
        `[fetchProductFromRelaySet]: Product event ${product.id} failed validation`
      )
      reject()
    })
  })
}
