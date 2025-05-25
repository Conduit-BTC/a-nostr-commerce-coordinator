import { Buffer } from 'buffer'
import { getLocationFromZipCode } from '../getLocationFromZipCode'
import type { Transaction } from '@/types/types'

// TODO: This is copy-pasta. Refactor to fresh pasta.

type ShipStationOrder = {
  items: ShipStationItem[]
}

type ShipStationItem = {
  lineItemKey: string
  sku: string
  name: string
  imageUrl?: string
  weight: {
    value: number
    units: 'ounces'
  }
  quantity: number
  unitPrice: number
  shippingAmount: number
}

export async function createShipStationOrder(transaction: Transaction) {
  try {
    const order = await convertTransactionToShipStationOrder(transaction)

    const response = await fetch(
      'https://ssapi.shipstation.com/orders/createorder',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${process.env.SHIPSTATION_API_KEY}:${process.env.SHIPSTATION_API_SECRET}`
          ).toString('base64')}`
        },
        body: JSON.stringify(order)
      }
    )

    if (!response.ok) {
      throw new Error(
        `Error POSTing to ShipStation - ShipStation Response: ${response.status} - ${response.statusText}`
      )
    }

    const data = await response.json()
    return data.orderId
  } catch (error) {
    console.error('Error creating ShipStation order:', error)
    throw error
  }
}

async function convertTransactionToShipStationOrder(
  transaction: Transaction
): ShipStationOrder {
  const { city, state, country } = await getLocationFromZipCode(order.zip)

  // TODO: Convert kgs to oz, if necessary

  return {
    orderNumber: order.id.toString(),
    orderDate: new Date().toISOString(),
    orderStatus:
      process.env.APP_ENV === 'production' ? 'awaiting_shipment' : 'cancelled',
    billTo: {
      name: `${order.first_name} ${order.last_name}`,
      company: null,
      street1: order.address1,
      street2: order.address2 || null,
      city,
      state,
      postalCode: order.zip,
      country: country,
      phone: null,
      residential: true
    },
    shipTo: {
      name: `${order.first_name} ${order.last_name}`,
      company: null,
      street1: order.address1,
      street2: order.address2 || null,
      city,
      state,
      postalCode: order.zip,
      country: country,
      phone: null,
      residential: true
    },
    items: await createShipStationItems(order.cart)
  }
}

async function createShipStationItems(cart): ShipStationItem[] {
  const items: ShipStationItem[] = []

  for (const item of cart.items) {
    const { productId, quantity } = JSON.parse(item)

    items.push({
      lineItemKey: product.id,
      sku: product.sku,
      name: product.name,
      imageUrl: product.image_url || null,
      weight: {
        value: product.weight,
        units: 'ounces'
      },
      quantity: quantity,
      unitPrice: product.price,
      shippingAmount: cart.shipping_cost_usd
    })
  }

  return items
}

module.exports = {
  createShipStationOrder
}
