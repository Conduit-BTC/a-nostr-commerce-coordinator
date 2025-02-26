⚠️ This project is under heavy development - Clone and tinker, or wait for release ⚠️

# A Nostr Commerce Coordinator - Nostr Daemon for Merchant Rockstars

THIS IS A WORK IN PROGRESS > Subscribe to our newsletter for updates about Conduit BTC, the C3 system, our in-development Nostr E-Commerce client, and more - The Conduit Signal
Learn more about NCCs by reading their debut article: Nostr E-Commerce - Benefits, Shortcomings, and The Case for Coordinators

### GammaMarkets Spec - a Nostr Extension Possibility (NEP)
Together with a team of other rockstar Nostr marketplace devs, we've aligned our daemon with the GammaMarkets Market Spec, for maximum interoperability between clients. See the spec at https://github.com/GammaMarkets/market-spec

### What is an NCC?

An NCC (Nostr Commerce Coordinator) is a server-based Nostr bot that:

- Is under control of, and represents, the Merchant on Nostr
- Subscribes to a relay pool
- Posts and queries e-commerce related events
- Coordinates the Checkout process on behalf of a Merchant
- Inventory Management: verify, increment, and decrement product stock, create and update Stalls and Products on relays via signed events
- Payment Processing: generate Lightning invoices, send invoice to customer, respond to payment events via webhook
- Fulfillment Services: create shipments, notify fulfillment partners
- Handle Checkout-related communications with the Customer
- Notify Merchant when certain things occur
- Collect sales-relates metrics for Merchant visibility

To summarize the benefits of an NCC:

- Automated, frictionless checkout flow
- Direct integration with Merchant's existing e-commerce stack: inventory management, payment processing, and shipping service
- Separation of Checkout-related direct messages (containing ugly JSON) from actual human readable direct messages,
- General separation-of-concerns between Merchant's social graph and e-commerce activities
- Ability to implement additional commerce features, such as metrics collection, financial statements, subscriptions, and much more yet-to-be explored possibilities

