# Deployment Notes

## Required Environment Variables on Vercel

```
NEXTAUTH_SECRET=generate-a-long-random-string
NEXTAUTH_URL=https://nexusai-commerce.vercel.app
DATABASE_URL=file:./dev.db
PLATFORM_XRPL_ADDRESS=rYourAddress
```

For production DB use PostgreSQL (Supabase/Neon):
```
DATABASE_URL=postgresql://...
```

## Manual Redeploy

1. Open Vercel Dashboard → nexusai-commerce
2. Settings → Git → ensure linked to Johanne012/nexusai-commerce
3. Deployments → Redeploy latest commit
4. Add env vars above if missing

## Local

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```
