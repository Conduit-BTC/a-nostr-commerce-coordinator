import {
  getMerchantSpecificProductFilter,
  merchantProductsFilter
} from '@/utils/constants'
import getDb from '@/services/dbService'
import { getHomeRelaySet, getNdk, getRelayPool } from '@/services/ndkService'
import { NDKRelaySet, type NDKEvent } from '@nostr-dev-kit/ndk'
import { DB_NAME } from '@/utils/constants'
import {
  validateProductListing,
  type ProductListing
} from 'nostr-commerce-schema'

const Products = {
  subscribe: async () => subscribe(),
  getOne: async (productId: string) => getProduct(productId)
} as const

export default Products

async function subscribe() {
  console.log('[Products.start]: Synchronizing products...')

  const filter = merchantProductsFilter

  const ndk = await getNdk()

  const homeRelaySet = await getHomeRelaySet()
  const relayPool = await getRelayPool()

  const productsDb = getDb().openDB({ name: DB_NAME.PRODUCTS })
  const shippingOptionsDb = getDb().openDB({ name: DB_NAME.SHIPPING_OPTIONS })

  console.log('[Products.start]: Clearing out the product events database...')
  productsDb.clearSync() // Clear out the DB, get ready for a fresh sync
  console.log('[Products.start]: Product events database cleared')

  console.log(
    '[Products.start]: Clearing out the shipping option events database...'
  )
  shippingOptionsDb.clearSync() // Clear out the DB, get ready for a fresh sync
  console.log('[Products.start]: Shipping option events database cleared')

  const homeRelaySubscription = ndk.subscribe(
    filter,
    { closeOnEose: false },
    homeRelaySet
  )

  homeRelaySubscription.on('event', async (event: NDKEvent) => {
    // This subscription stays open for the lifetime of the application
    console.log(
      `[Products.start]: Received Product event from HomeRelay: ${event.id}`
    )

    const product = event.rawEvent()

    const dTag = product.tags.find((tag) => tag[0] === 'd') // Constant Product ID

    if (!dTag || !dTag[1]) {
      console.error(
        `[Products.start]: Product event ${product.id} missing d tag`
      )
      return
    }

    const productId = dTag[1]

    // This is simply mirroring the home relay event to the local database, then broadcasting it out to the relay pool
    console.log('[Products.start]: Storing product event in local database...')
    await productsDb.put(`nostr-product-event:${productId}`, product)
    console.log(
      '[Products.start]: Product event stored in local database: ' +
        `nostr-product-event:${productId}`
    )

    if (relayPool.size === 0) {
      console.warn('[Products.start]: WARN: No relays in relay pool')
      return
    }

    console.log('[Products.start]: Broadcasting product event to relay pool...')
    relayPool.relays.forEach((relay) => {
      console.log(
        `[Products.start]: Broadcasting product event to relay: ${relay.url}`
      )
      relay.publish(event)
    })
    console.log('[Products.start]: Product event broadcasted to relay pool')
  })

  await new Promise<void>((resolve) => {
    homeRelaySubscription.on('eose', () => {
      console.log(
        '[Products.start]: All events from HomeRelay received. Finishing up...'
      )
      homeRelaySubscription.off('eose', () => {})
      resolve()
    })
  })

  await new Promise((resolve) => setTimeout(resolve, 1000)) // Arbitrary timeout to complete the sync

  console.log('[Products.start]: Initial product sync complete!')
}

/*
 * Attempts to retrieve a single Product from the DB, fails over to the HomeRelay, finally to the RelayPool.
 */
async function getProduct(productId: string): Promise<ProductListing | null> {
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

async function fetchProductFromRelaySet(
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
