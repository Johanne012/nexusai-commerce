# NexusAI Commerce

منصة SaaS لإنتاج وبيع المنتجات الرقمية بالذكاء الاصطناعي + مدفوعات XRP + XRPL Escrow + اشتراكات.

## المميزات

- 8 أنواع منتجات × 4 مستويات جودة (عربي / إنجليزي)
- دفع XRP مع Destination Tag والتحقق عبر XRPSCAN
- مزود Demo للاختبار
- سوق وساطة (Escrow)
- اشتراكات Free / Pro / Enterprise
- NextAuth (Credentials + جاهز لـ GitHub/Google)
- واجهة RTL داكنة

## التشغيل المحلي

```bash
git clone https://github.com/Johanne012/nexusai-commerce.git
cd nexusai-commerce
cp .env.example .env
# عدّل NEXTAUTH_SECRET و PLATFORM_XRPL_ADDRESS

npm install
npx prisma generate
npx prisma db push
npm run dev
```

افتح http://localhost:3000

## متغيرات البيئة (Vercel)

| المتغير | مطلوب |
|---------|--------|
| `NEXTAUTH_SECRET` | نعم |
| `NEXTAUTH_URL` | نعم |
| `DATABASE_URL` | نعم (`file:./dev.db` أو Postgres) |
| `PLATFORM_XRPL_ADDRESS` | للدفع الحقيقي |

## الصفحات

| المسار | الوظيفة |
|--------|----------|
| `/` | الرئيسية |
| `/products` | المنتجات |
| `/generate` | توليد بالذكاء |
| `/subscriptions` | الخطط |
| `/pay` | دفع XRP |
| `/marketplace` | سوق الوساطة |
| `/dashboard` | لوحة التحكم |
| `/login` `/register` | المصادقة |

## البناء الآلي

- `vercel.json` → `prisma generate && next build`
- GitHub Actions على كل push لـ `main`

## الترخيص

MIT
