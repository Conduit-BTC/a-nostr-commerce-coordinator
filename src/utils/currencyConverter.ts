const STRIKE_API_KEY = process.env.STRIKE_API_KEY!

// Cache for storing exchange rate with timestamp
interface ExchangeRateCache {
  usdToBtcRate: number
  timestamp: number
}

let exchangeRateCache: ExchangeRateCache | null = null
const CACHE_DURATION_MS = 5000 // 5 seconds
const SATS_PER_BTC = 100_000_000

/**
 * Converts between USD and SATS using Strike API rates with caching
 * @param amount - The amount to convert
 * @param currency - Either "USD" or "SATS"
 * @returns Promise<number> - The converted amount in the opposite currency
 */
export async function convertCurrency(
  amount: number,
  currency: 'USD' | 'SATS'
): Promise<number> {
  const usdToBtcRate = await getCachedExchangeRate()
  const usdToSatsRate = usdToBtcRate / SATS_PER_BTC

  if (currency === 'USD') {
    // Convert USD to SATS
    return Math.round(amount / usdToSatsRate)
  } else if (currency === 'SATS') {
    // Convert SATS to USD
    return amount * usdToSatsRate
  } else {
    throw new Error(`Unsupported currency: ${currency}`)
  }
}

/**
 * Gets the USD to BTC exchange rate with caching
 * Returns cached value if within 5-second window, otherwise fetches new rate
 */
async function getCachedExchangeRate(): Promise<number> {
  const now = Date.now()

  // Check if we have a valid cached rate
  if (
    exchangeRateCache &&
    now - exchangeRateCache.timestamp < CACHE_DURATION_MS
  ) {
    return exchangeRateCache.usdToBtcRate
  }

  // Fetch new rate from Strike API
  try {
    const usdToBtcRate = await fetchExchangeRateFromStrike()

    // Update cache
    exchangeRateCache = {
      usdToBtcRate,
      timestamp: now
    }

    return usdToBtcRate
  } catch (error) {
    console.error(
      '[getCachedExchangeRate]: Error fetching exchange rate:',
      error
    )

    // If we have a stale cached rate, use it as fallback
    if (exchangeRateCache) {
      console.warn(
        '[getCachedExchangeRate]: Using stale cached rate as fallback'
      )
      return exchangeRateCache.usdToBtcRate
    }

    throw new Error(
      'Failed to fetch exchange rate and no cached rate available'
    )
  }
}

/**
 * Fetches the current USD to BTC exchange rate from Strike API
 */
async function fetchExchangeRateFromStrike(): Promise<number> {
  const headers = new Headers()
  headers.append('Accept', 'application/json')
  headers.append('Authorization', `Bearer ${STRIKE_API_KEY}`)

  const response = await fetch('https://api.strike.me/v1/rates/ticker', {
    method: 'GET',
    headers
  })

  if (!response.ok) {
    throw new Error(
      `Strike API error: ${response.status} ${response.statusText}`
    )
  }

  const data = await response.json()

  // Find USD to BTC rate from the response
  // The API returns an array of currency pairs
  const usdBtcPair = data.find(
    (pair: any) =>
      pair.sourceCurrency === 'USD' && pair.targetCurrency === 'BTC'
  )

  if (!usdBtcPair) {
    throw new Error('USD to BTC rate not found in Strike API response')
  }

  return parseFloat(usdBtcPair.amount)
}

/**
 * Helper function to clear the cache (useful for testing)
 */
export function clearExchangeRateCache(): void {
  exchangeRateCache = null
}
