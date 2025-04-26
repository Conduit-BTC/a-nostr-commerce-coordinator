import { SIZE_UNIT } from "@/utils/constants";
import type { MerchantPackageSpec, Package, ShippingCostQuotePayload, TransactionProduct } from "@/types/types";
/**
 * Calculate shipping costs for a set of items to a zip code
 * @param {string} zip - Destination zip code
 * @param {Array} items - Cart items to be shipped
 * @returns {Promise<{ success: boolean, cost?: number, error?}: { message: string, status?: number }>}
 */
export async function calculateVariableShippingCost(address: string, items: TransactionProduct[]): Promise<{ success: boolean, cost?: number, error?: { message: string, status: number } }> {
    try {
        const { zip } = parseAddressString(address);
        const packageSpecs: MerchantPackageSpec[] = getMerchantPackageSpecs();
        const packages: Package[] = generatePackages(items, packageSpecs);
        let totalCost = 0.0;

        for (const pkg of packages) {
            const payload: ShippingCostQuotePayload = createShippingCostQuotePayload(zip, pkg);
            const rateResponse = await fetchShippingCostQuote(payload);

            if (!rateResponse.success) {
                return {
                    success: false,
                    error: rateResponse.error
                };
            }

            totalCost += rateResponse.cost;
        }

        return {
            success: true,
            cost: totalCost
        };

    } catch (error: any) {
        return {
            success: false,
            error: {
                message: '[calculateVariableShippingCost]: Error calculating shipping cost',
                status: error.status || 500
            }
        };
    }
}

function getMerchantPackageSpecs(): MerchantPackageSpec[] {
    console.error("[calculateVariableShippingCost > getMerchatPackagePreferences]: <<< NOT IMPLEMENTED. USING FAKE DATA. Fetch from MerchantSettings database, instead.")
    return [{
        height: 10,
        width: 10,
        length: 2,
        sizeUnit: SIZE_UNIT.INCH
    }];
}

function createShippingCostQuotePayload(zip: string, pkg: Package) {
    const originZIPCode = 12345; // TODO: <<< Replace with zip code from MerchantSettings

    return {
        originZIPCode,
        destinationZIPCode: zip,
        weight: pkg.weight,
        length: pkg.length,
        width: pkg.width,
        height: pkg.height,
        mailClasses: ['USPS_GROUND_ADVANTAGE'],
        priceType: 'CONTRACT',
    };
}

/**
 * Fetch shipping rate for a single package
 */
async function fetchShippingCostQuote(payload: ShippingCostQuotePayload): Promise<{ success: boolean, cost?: number, error?: { message: string, status: number } }> {
    const bearer = (await getUspsOauthToken()).access_token;

    try {
        const response = await fetch(
            'https://api.usps.com/prices/v3/total-rates/search',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${bearer}`,
                },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            return {
                success: false,
                error: {
                    message: 'Issue requesting shipping cost estimation from USPS',
                    status: response.status
                }
            };
        }

        const data = await response.json();
        return {
            success: true,
            cost: data.rateOptions[0].totalBasePrice
        };

    } catch (error: any) {
        console.error('Error fetching package rate:', error);
        return {
            success: false,
            error: {
                message: 'Error fetching package rate',
                status: error.status || 500
            }
        };
    }
}

function generatePackages(items: TransactionProduct[], packageSpecs: MerchantPackageSpec[]): Package[] {
    // Flatten item list based on quantity
    const flattenedItems = items.flatMap(item =>
        Array(item.quantity || 0).fill({
            weight: item.dimensions?.weight ? item.dimensions.weight + 2.0 : 0.0,
            ...item.dimensions, // optional: include dimensions if needed
        })
    );

    const packages: Package[] = [];
    let currentIndex = 0;

    while (currentIndex < flattenedItems.length) {
        let packed = false;

        // Try each packageSpec in order
        for (const spec of packageSpecs) {
            const maxWeight = spec.maxWeight ?? Infinity;
            const volumeLimit = spec.length * spec.width * spec.height;

            const itemsInPackage = [];
            let runningWeight = 0;
            let runningVolume = 0;

            for (let i = currentIndex; i < flattenedItems.length; i++) {
                const item = flattenedItems[i];
                const itemVolume = (item.length || 1) * (item.width || 1) * (item.height || 1);

                if (
                    runningWeight + item.weight <= maxWeight &&
                    runningVolume + itemVolume <= volumeLimit
                ) {
                    itemsInPackage.push(item);
                    runningWeight += item.weight;
                    runningVolume += itemVolume;
                } else {
                    break;
                }
            }

            if (itemsInPackage.length > 0) {
                packages.push({
                    units: spec.sizeUnit,
                    length: spec.length,
                    width: spec.width,
                    height: spec.height,
                    weight: runningWeight,
                    itemCount: itemsInPackage.length,
                });

                currentIndex += itemsInPackage.length;
                packed = true;
                break;
            }
        }

        if (!packed) {
            throw new Error(`Item at index ${currentIndex} does not fit in any provided packageSpec.`);
        }
    }

    return packages;
}

async function getUspsOauthToken(): Promise<{ access_token: string }> {
    const tokenUrl = 'https://api.usps.com/oauth2/v3/token';
    const clientId = process.env.USPS_CLIENT_ID;
    const clientSecret = process.env.USPS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Missing USPS client ID or client secret');
    }

    const data = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
    });

    try {
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data.toString(),
        });

        if (response.ok) return await response.json();
        else throw new Error(`${response.status}: ${await response.text()}`);
    } catch (error: any) {
        console.error('Error obtaining token from USPS: ' + error);
        throw error;
    }
}
