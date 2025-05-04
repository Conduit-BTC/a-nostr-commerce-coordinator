import Settings from './modules/settings'
import Queues from './modules/queues'
import WebhookServer from './modules/webhooks'
import Subscriber from './modules/subscriber'

const Coordinator = {
  start: () => start()
} as const

export default Coordinator

async function start(): Promise<void> {
  try {
    Settings.init()
    Queues.init()
    WebhookServer.start()
    await Subscriber.start()
  } catch (error) {
    console.error(`[Coordinator]: Start failed: ${error}`)
    process.exit(1)
  }
}
