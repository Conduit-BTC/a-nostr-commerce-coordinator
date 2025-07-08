import Settings from './modules/settings'
import Queues from './modules/queues'
import WebhookServer from './modules/webhooks'
import Subscriber from './modules/subscriber'

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})

try {
  Settings.init()
  Queues.init()
  WebhookServer.start()
  await Subscriber.start()
} catch (error) {
  console.error(`[Coordinator]: Start failed: ${error}`)
  process.exit(1)
}
