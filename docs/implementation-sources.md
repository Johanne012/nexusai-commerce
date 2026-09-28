# Implementation references

Reviewed on 2026-09-27 while hardening payment callbacks and changing the Prisma provider.

- Stripe webhook verification and signed `Stripe-Signature` header: https://docs.stripe.com/webhooks
- Stripe Checkout fulfillment guidance: https://docs.stripe.com/checkout/fulfillment
- Stripe event types, including Checkout Session completion: https://docs.stripe.com/api/events/types
- Prisma migration workflows: https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production

Stripe fulfillment is performed by a signed webhook and can also be confirmed after the browser redirect by retrieving the server-side Checkout Session. Both paths verify the same persisted payment record and are idempotent. Prisma migrations are database-provider-specific; the PostgreSQL migration in this project creates a new PostgreSQL schema and is not an automatic SQLite data-copy operation. This project is pinned to Prisma 5.x, so its production migration command is `prisma migrate deploy`.
