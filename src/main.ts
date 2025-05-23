import Config from './config'
import { EventBus } from './events/NCCEventBus'
import { loadModules } from './core/load-modules'
import { loadSubscriptions } from './core/load-subscriptions'
import { runEagerLoaders, runLazyLoaders } from './core/register-loaders'

console.log('[main.ts] > Starting NCC...')

const modules = await loadModules({ config: Config, eventBus: EventBus })

const appContainer: NCCAppContainer = {
  modules: Object.fromEntries(modules.map((mod) => [mod.name, mod])),
  eventBus: EventBus
}

await loadSubscriptions(appContainer)
await runEagerLoaders(modules)
await runLazyLoaders(modules)

// Start the webhook server

console.log('[main.ts] > NCC load complete')
