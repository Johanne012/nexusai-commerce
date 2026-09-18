# NexusAI Commerce

AI-Powered Digital Products Store with XRP, XRPL Escrow, subscriptions, social login.

## Quick Start

```bash
git clone https://github.com/Johanne012/nexusai-commerce.git
cd nexusai-commerce
cp .env.example .env
npm install
npx prisma generate && npx prisma db push
npm run dev
```

## Security & Scaling

- Local: SQLite
- Production: PostgreSQL (Supabase/Railway) + SSL + pooling
- Social login (GitHub/Google) for customer acquisition
- Never commit .env

## Deploy on Vercel

Import the GitHub repo, set env vars (NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL, PLATFORM_XRPL_ADDRESS), deploy.

MIT
