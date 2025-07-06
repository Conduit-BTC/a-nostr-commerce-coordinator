import NCCService from '@/core/base-classes/NCCService'
import type { ProductsModule } from '.'

export default class ProductsService extends NCCService<
  ProductsService,
  ProductsModule
> {
  async createProduct(productData: {
    eventId: string
    merchantPubkey: string
    title: string
    description?: string
    images?: string[]
    price: { amount: number; currency: string; frequency?: string }
    inventory?: { quantity: number; maxQuantity?: number }
    dimensions?: {
      sizeUnit: 'cm' | 'in'
      weightUnit: 'kg' | 'oz'
      length?: number
      width?: number
      height?: number
      weight?: number
    }
    shipping?: {
      weight: number
      weightUnit: 'kg' | 'oz'
      dimensions?: {
        length: number
        width: number
        height: number
        sizeUnit: 'cm' | 'in'
      }
      shippingClass?: string
      handlingFee?: number
    }
    metadata?: Record<string, string>
  }) {
    const productId = `product_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`

    const product = {
      productId,
      ...productData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    await this.module.persistence.product.create(productId, product)
    return product
  }

  async getProduct(productId: string) {
    return this.module.persistence.product.get(productId)
  }

  async updateProduct(
    productId: string,
    updates: Partial<{
      title: string
      description: string
      images: string[]
      price: { amount: number; currency: string; frequency?: string }
      inventory: { quantity: number; maxQuantity?: number }
      metadata: Record<string, string>
    }>
  ) {
    const product = await this.module.persistence.product.get(productId)
    if (!product) {
      throw new Error('Product not found')
    }

    const updatedProduct = {
      ...product,
      ...updates,
      updatedAt: Date.now()
    }

    await this.module.persistence.product.update(productId, updatedProduct)
    return updatedProduct
  }

  async listProducts() {
    return this.module.persistence.product.list()
  }

  async listProductsByEvent(eventId: string) {
    const products = await this.module.persistence.product.list()
    return products.filter((product: any) => product.eventId === eventId)
  }

  async listProductsByMerchant(merchantPubkey: string) {
    const products = await this.module.persistence.product.list()
    return products.filter(
      (product: any) => product.merchantPubkey === merchantPubkey
    )
  }
}
