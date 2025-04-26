import { describe, test, expect, beforeEach, mock } from "bun:test";
import { prepareTransactionItems_TEST as prepareTransactionItems } from "@/core/checkout/processOrder";
import { CHECKOUT_ERROR } from "@/utils/constants";
import { OrderUtils } from "nostr-commerce-schema";
import type { OrderItem } from "@/types/types";

const mockRelaySet = {
    subscribe: () => ({ on: () => { }, start: () => { } }),
    relays: []
};

mock.module("@/services/ndkService", () => ({
    getHomeRelaySet: mock(async () => mockRelaySet),
    getRelayPool: mock(async () => mockRelaySet)
}));

mock.module("@/core/checkout/fetchProductFromRelaySet", () => ({
    default: mock(async () => null)
}));

mock.module("@/services/dbService", () => ({
    default: () => ({
        openDB: () => ({
            get: mock(async () => null),
            put: mock(async () => true)
        })
    })
}));

const mockProductListingUtils = {
    getProductPrice: mock((_) => ({ amount: "10.00", currency: "USD" })),
    getProductStock: mock(() => 10),
    getProductTitle: mock(() => "Test Product")
};

const mockProduct = {
    kind: 30402,
    tags: [
        ["d", "found-product"],
        ["title", "Test Product"],
        ["price", "10.00", "USD"],
        ["type", "simple", "physical"],
        ["visibility", "on-sale"],
        ["stock", "10"]
    ],
    content: "Test product description",
    created_at: 1677721600
};

describe("prepareTransactionItems", () => {
    beforeEach(() => {
        mock.restore();

        const mockDbGet = mock();

        mock.module("@/services/dbService", () => ({
            default: () => ({
                openDB: () => ({
                    get: mockDbGet,
                    put: mock(async () => true)
                })
            })
        }));
    });

    test("should handle empty items array", async () => {
        const items: OrderItem[] = [];
        const result = await prepareTransactionItems(items);

        expect(result).toEqual({
            transactionItems: [],
            missingItems: []
        });
    });

    test("should process items and return transaction items for valid products", async () => {
        // Setup DB to return a product for the specific key
        const mockDbGet = mock(async (key) => {
            if (key === `nostr-product-event:found-product`) {
                return mockProduct;
            }
            return null;
        });

        mock.module("@/services/dbService", () => ({
            default: () => ({
                openDB: () => ({
                    get: mockDbGet,
                    put: mock(async () => true)
                })
            })
        }));

        const items = [
            {
                productRef: "30402:pubkey:found-product",
                quantity: 2
            }
        ];

        const result = await prepareTransactionItems(items);

        expect(result.transactionItems).toHaveLength(1);
        expect(result.missingItems).toHaveLength(0);
        expect(result.transactionItems[0]).toEqual({
            success: true,
            product: expect.objectContaining({
                kind: 30402,
                tags: expect.arrayContaining([["d", "found-product"]])
            }),
            quantity: 2,
            pricePerItem: { amount: "10.00", currency: "USD" }
        });
    });

    test("should handle missing products", async () => {
        // Ensure all product lookups return null
        const mockDbGet = mock(async () => null);

        mock.module("@/services/dbService", () => ({
            default: () => ({
                openDB: () => ({
                    get: mockDbGet,
                    put: mock(async () => true)
                })
            })
        }));

        mock.module("@/core/checkout/fetchProductFromRelaySet", () => ({
            default: mock(async () => null)
        }));

        const items = [
            {
                productRef: "30402:pubkey:missing-product",
                quantity: 1
            }
        ];

        const result = await prepareTransactionItems(items);

        expect(result.transactionItems).toHaveLength(0);
        expect(result.missingItems).toHaveLength(1);
        expect(result.missingItems[0]).toEqual({
            success: false,
            error: CHECKOUT_ERROR.PRODUCT_MISSING,
            message: expect.stringContaining("missing-product")
        });
    });

    test("should process mix of valid and missing products", async () => {
        // Setup the database to return the found product but null for the missing one
        let callCount = 0;
        const mockDbGet = mock(async (key) => {
            callCount++;
            if (callCount === 1 && key === `nostr-product-event:found-product`) {
                return mockProduct;
            }
            return null;
        });

        mock.module("@/services/dbService", () => ({
            default: () => ({
                openDB: () => ({
                    get: mockDbGet,
                    put: mock(async () => true)
                })
            })
        }));

        const items = [
            {
                productRef: "30402:pubkey:found-product",
                quantity: 2
            },
            {
                productRef: "30402:pubkey:missing-product",
                quantity: 1
            }
        ];

        const result = await prepareTransactionItems(items);

        expect(result.transactionItems).toHaveLength(1);
        expect(result.missingItems).toHaveLength(1);
        expect(result.transactionItems[0].product).toHaveProperty("tags");
        expect(result.missingItems[0]).toHaveProperty("error", CHECKOUT_ERROR.PRODUCT_MISSING);
    });

    test("should extract product IDs correctly using OrderUtils", async () => {
        const mockDbGet = mock(async () => mockProduct);

        mock.module("@/services/dbService", () => ({
            default: () => ({
                openDB: () => ({
                    get: mockDbGet,
                    put: mock(async () => true)
                })
            })
        }));

        const getProductIdSpy = mock(() => "found-product");

        mock.module("nostr-commerce-schema", () => ({
            OrderUtils: {
                getProductIdFromOrderItem: getProductIdSpy,
                getOrderItems: OrderUtils.getOrderItems,
                getOrderId: OrderUtils.getOrderId
            },
            ProductListingUtils: mockProductListingUtils
        }));

        const items = [
            {
                productRef: "30402:pubkey:found-product",
                quantity: 2
            }
        ];

        await prepareTransactionItems(items);

        expect(getProductIdSpy).toHaveBeenCalledWith(items[0]);
    });
});
