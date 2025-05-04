# Orders Module

Order.create
Order.store
Order.status
Order.rawEvent

Transaction.create -> Transaction
Transaction.store --> DB.store('transactions-db')
Transaction.type -->

EventParserValidationObject {
decryptedEvent: Event
isRelevant: boolean // if false, will add decryptedEvent.id to the ignore list
success: boolean // if false, will add event to the FailQueue
kind: Order | DM | Other
}

Subscriber.onmessage -> (not an ignored event) -> EventRouter.push() -> EventParser.decrypt(rawEvent) -> EventParser.validate(decryptedEvent) (returns ) -> Order.create(rawEvent, decryptedEvent) / Subscriber.ignore(string) / Order.fail(rawEvent)

OrderQueue -> event.decrypted -> Order.process(event)

FailQueueObject {
type: SubscriberFailure, EventRouterFailure, EventParserFailure, OrderCreationFailure, PaymentFailure, FulfillmentFailure, MessageFailure, UncategorizedFailure
message: // Original error message
}
