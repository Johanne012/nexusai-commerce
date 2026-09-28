# Deployment Guide

## Requirements
- Node.js 20.9 or newer.
- A managed PostgreSQL database (Neon, Supabase, or another PostgreSQL provider).
- Set the environment variables below in the deployment environment.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/nexusai?schema=public&sslmode=require"
NEXTAUTH_URL="https://your-domain.example"
NEXTAUTH_SECRET="a-long-random-secret-at-least-32-characters"
XRP_USD_RATE="0.6"
# Configure at least one real provider before accepting orders:
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
# or PLATFORM_XRPL_ADDRESS="r..."
```

Never deploy `.env`, test credentials, demo users, or private keys. Configure Stripe to send `checkout.session.completed` and `checkout.session.async_payment_succeeded`, and `invoice.paid` to `/api/payments/stripe/webhook`. The endpoint validates Stripe's signature. Use Stripe test mode for staging.

## PostgreSQL migrations

The included PostgreSQL migration creates a fresh schema. Set `DATABASE_URL` to a staging database and run:

```bash
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run typecheck
npm test
npm run build
```

Run migrations as a deployment step before starting the new application version. Do not use `prisma db push` in production.

### Migrating existing SQLite data

Prisma migration files are provider-specific. The PostgreSQL migration does **not** automatically copy an existing SQLite database. Back up the source database, provision PostgreSQL, apply the migration, then copy records using a reviewed ETL/export-import process that converts money fields to decimal values and preserves IDs, timestamps, foreign keys, and unique constraints. Verify row counts and sample payment/order ownership before switching traffic. Never copy demo accounts or mark historical unverified payments as completed.

## Payment and marketplace status

Demo payment is available only in development. A real provider must be configured to accept payments. Order and subscription fulfillment is server-side after provider verification. The marketplace currently functions as a job board; it does not custody or release XRP through XRPL Escrow. Do not represent job amounts as funded or protected until real escrow transactions and dispute flows are implemented.
