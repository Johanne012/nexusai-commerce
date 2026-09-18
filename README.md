# NexusAI Commerce

**AI-Powered Digital Products & Services Store** with XRP payments, automated generation, subscriptions, and Escrow marketplace.

## Features

- **AI Content Generation** – Automatically creates digital products
- **XRP Payments** – Native support via XRPL + verification through XRPSCAN API
- **Multi-Provider Ready** – Easy to add Stripe, PayPal, other cryptos later
- **Subscriptions** – Free / Pro / Enterprise plans
- **Escrow Marketplace** – Brokerage for development, financing and advertising
- **Fully Automated** – Background jobs for generation, payment checking, reports
- **Modern Stack** – Next.js 14, Prisma, Tailwind, TypeScript

## Getting Started

```bash
npm install
cp .env.example .env
# Edit .env with your PLATFORM_XRPL_ADDRESS
npx prisma generate
npx prisma db push
npm run dev
```

## XRP Payment Flow

1. `POST /api/payments/xrp/create` → returns address + Destination Tag
2. User sends XRP with that Tag
3. `POST /api/payments/xrp/verify` with txHash → verifies via XRPSCAN
4. System activates order / subscription automatically

## Adding New Payment Providers

Implement the `PaymentProvider` interface in `src/lib/payments/` and register it in `index.ts`.

## License

MIT
