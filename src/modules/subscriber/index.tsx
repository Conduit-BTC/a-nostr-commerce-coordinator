import getDb from "@/services/dbService"
import DirectMessages from "../direct-messages"
import Products from "../products"
import Shipping from "../shipping"
import { DB_NAME } from "@/utils/constants"
import { ignoredEventIds } from "@/utils/shouldIgnoreEvent"

const Subscriber = {
    start: async () => {
        loadIgnoredEvents()
        await Products.subscribe()
        await Shipping.subscribe()
        await DirectMessages.subscribe()
        // await Receipts.subscribe()
    }
} as const

export default Subscriber

function loadIgnoredEvents(): void {
    const processingOrdersDb = getDb().openDB({ name: DB_NAME.PROCESSING_ORDERS })
    const successfulOrdersDb = getDb().openDB({ name: DB_NAME.SUCCESSFUL_ORDERS })
    const failedOrdersDb = getDb().openDB({ name: DB_NAME.FAILED_ORDERS })
    const ignoredEventsDb = getDb().openDB({ name: DB_NAME.IGNORED_EVENTS })
  
    ignoredEventsDb
      .getKeys()
      .forEach((key) => ignoredEventIds.add(key.toString().split(':')[1]))
    processingOrdersDb
      .getKeys()
      .forEach((key) => ignoredEventIds.add(key.toString().split(':')[1]))
    successfulOrdersDb
      .getKeys()
      .forEach((key) => ignoredEventIds.add(key.toString().split(':')[1]))
    failedOrdersDb
      .getKeys()
      .forEach((key) => ignoredEventIds.add(key.toString().split(':')[1]))
  }