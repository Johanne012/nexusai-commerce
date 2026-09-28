# NexusAI Commerce

منصة تجريبية للتجارة الرقمية: توليد منتجات بالذكاء الاصطناعي، متجر، تسعير، طلبات، اشتراكات، وسوق وظائف. المشروع لا ينفذ حاليًا ضمان أموال حقيقيًا على XRPL؛ السوق لوحة وظائف فقط.

## المتطلبات والتشغيل

1. أنشئ قاعدة PostgreSQL ثم انسخ `.env.example` إلى `.env` واضبط `DATABASE_URL` و`NEXTAUTH_SECRET` و`NEXTAUTH_URL`.
2. ثبّت Node.js 20.9 أو أحدث.
3. شغّل:

```bash
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

في بيئة النشر، استخدم `npm run db:migrate:deploy` لتطبيق migrations الموجودة فقط. لا تستخدم `prisma db push` للإنتاج.

## الحسابات والبيانات

لا يحتوي المشروع على كلمة مرور تجريبية عامة ولا ينبغي إنشاء حسابات افتراضية في الإنتاج. استخدم تسجيل الحساب العادي، أو فعّل OAuth بعد ضبط بيانات المزود.

## الدفع

- XRP: يتطلب `PLATFORM_XRPL_ADDRESS` وواجهة XRPSCAN، ويتم ربط المعاملة بسجل الدفع ومبلغ/وسم متوقعين على الخادم.
- Stripe: المنتجات دفعة واحدة؛ الخطط اشتراك شهري متكرر. يتطلب `STRIPE_SECRET_KEY` و`STRIPE_WEBHOOK_SECRET`. وجّه أحداث `checkout.session.completed` و`checkout.session.async_payment_succeeded` و`invoice.paid` إلى `/api/payments/stripe/webhook`.
- Demo: يعمل في التطوير فقط، ولا يُختار تلقائيًا في الإنتاج.
- لا يمكن تفعيل خطة مدفوعة أو إكمال طلب من العميل دون تحقق الدفع.

راجع [DEPLOY.md](./DEPLOY.md) لخطوات PostgreSQL والترحيل من SQLite.

## التحقق محليًا

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## الترخيص
MIT
