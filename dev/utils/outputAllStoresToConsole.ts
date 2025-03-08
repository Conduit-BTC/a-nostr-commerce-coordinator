import { getQueue } from "@/queues/Queue";
import getDb from "@/services/dbService";
import { DB_NAME, QUEUE_NAME } from "@/utils/constants";
import isDebugMode from "dev/utils/debugModeControls";

export function outputAllStoresToConsole() {
    if (!isDebugMode) return;
    const productsDb = getDb().openDB({ name: DB_NAME.PRODUCTS });
    const processingOrdersDb = getDb().openDB({ name: DB_NAME.PROCESSING_ORDERS });
    const successfulOrdersDb = getDb().openDB({ name: DB_NAME.SUCCESSFUL_ORDERS });
    const failedOrdersDb = getDb().openDB({ name: DB_NAME.FAILED_ORDERS });
    const ignoredEventsDb = getDb().openDB({ name: DB_NAME.IGNORED_EVENTS });

    console.log('\n\n =====================');
    console.log('\n=== QUEUES\n');
    console.log('Current state of Direct Messages queue: ', getQueue(QUEUE_NAME.DIRECT_MESSAGES).getAllItems());
    console.log('Current state of Orders queue: ', getQueue(QUEUE_NAME.ORDERS).getAllItems());

    console.log('\n=== DATABASES\n');
    console.log('Current keys in Products database: ', Array.from(productsDb.getKeys()));
    console.log('Current keys in Processing Orders database: ', Array.from(processingOrdersDb.getKeys()));
    console.log('Current keys in Successful Orders database: ', Array.from(successfulOrdersDb.getKeys()));
    console.log('Current keys in Failed Orders database: ', Array.from(failedOrdersDb.getKeys()));
    console.log('Current keys in Ignored Events database: ', Array.from(ignoredEventsDb.getKeys()));
    console.log('\n=====================\n\n')
}
