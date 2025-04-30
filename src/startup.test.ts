// -- startup

// verifyEnvVars
// GIVEN env vars are set
// WHEN verifyEnvVars() runs
// THEN no error is thrown

// initSettings
// GIVEN all required settings have values
// WHEN initSettings() runs
// THEN no error is thrown

// initQueues
// WHEN initQueues() runs
// THEN a new queue is created: [Direct Messages Queue, Order Processing Queue]
// THEN that queue is added to the QueueRegistry

// initIgnoredEvents
// GIVEN an event is present in the PROCESSING_ORDERS, SUCCESSFUL_ORDERS, FAILED ORDERS, or IGNORED_EVENTS database
// WHEN initIgnoredEvents() runs
// THEN the event's ID is added to the ignoredEventIds Set

// startWebhookServer
// WHEN startWebhookServer() runs
// THEN an HTTP server is created
// THEN an endpoint at PORT is available


// -- Webhook server
// WHEN a request is sent to the webhook endpoint
// GIVEN body.data.entityId is a string
// GIVEN body.eventType === 'invoice.updated'
