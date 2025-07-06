import getDb from '@/services/dbService'
import { DB_NAME } from '@/utils/constants'
import isDebugMode from '@/dev/utils/debugModeControls'

/**
 * Before the Coordinator starts, the following details must be set by the Merchant, and/or the Merchant must be explicitly informed of the implications of not setting optional values:
 *
 * - Shipping origin zip code. Required for variable shipping cost calculation
 * - Shipping outbound address. Required for variable shipping cost calculation.
 * - Package specifications. Required for variable shipping cost calculation.
 *
 * See type: MerchantSettings
 */

const Settings = {
  init: () => init()
} as const

export default Settings

// TODO: All env vars must be moved out of the Coordinator. Some form of remote-hosted NSEC Bunker API will receive all sign & decrypt requests from the Coordinator, and a Secrets Manager will be used for the non-NSEC env vars.

const requiredEnvVars = [
  'PUBKEY',
  'PRIVKEY',
  'STRIKE_API_KEY',
  'USPS_CLIENT_ID',
  'SHIPSTATION_API_KEY',
  'SHIPSTATION_API_SECRET'
]

// TODO: Swap out DEBUG_MOD_CONTROLS app-wide with better debugging practice that doesn't litter the source code. Leaving here for now during early development.

const debugFlags = [
  'USE_TEST_PAYMENT_AMOUNT',
  'USE_MOCK_LIGHTNING_INVOICE',
  'SUPPRESS_OUTBOUND_MESSAGES'
]

function init(): void {
  // TODO: Perform a verification: Are there any ProductListings with dimensions that are larger than all available MerchantPackageSpecs? If so, notify the Merchant. Otherwise, the variable shipping price calculator will throw at generatePackages().
  console.error(
    '[startup] <<< verifyMerchantSettings not implemented! See function definition for more details\n'
  )

  verifyEnvVars(requiredEnvVars, debugFlags)

  console.log('[startup] Merchant Settings:')

  const settingsDb = getDb().openDB({ name: DB_NAME.SETTINGS })
  settingsDb.putSync('merchant_zip_code', '90046')
  settingsDb.getRange().forEach(({ key, value }) => {
    console.log(`> ${String(key)}: ${String(value)}`)
  })
}

function verifyEnvVars(required: string[], debug: string[]): void {
  // TODO: Recursively do this
  required.forEach((key) => {
    if (!process.env[key])
      throw new Error(
        `[startup > verifyEnvVars]: Environment Variable missing: ${key}`
      )
  })

  if (!isDebugMode()) return

  debug.forEach((key) => {
    if (process.env[key] === undefined) {
      throw new Error(
        `[startup > verifyDebugEnvVars]: Missing debug env var: ${key}`
      )
    }
  })
}
