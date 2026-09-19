import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[hsl(var(--primary)/0.15)] via-transparent to-transparent" />
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-1.5 text-sm mb-6">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            يعمل تلقائيًا — مدفوعات XRP + ذكاء اصطناعي
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl leading-tight">
            أنتج وبِع منتجات رقمية
            <span className="block text-[hsl(var(--primary))] mt-2">بالذكاء الاصطناعي</span>
          </h1>
          <p className="mt-6 text-lg text-[hsl(var(--muted-foreground))] leading-relaxed">
            منصة SaaS آلية بالكامل تولّد كتبًا إلكترونية، نصوصًا تسويقية، كودًا، تقارير وباقات خدمات،
            ثم تبيعها بـ XRP مع نظام اشتراكات وسوق وساطة (Escrow).
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/generate"
              className="rounded-xl bg-[hsl(var(--primary))] px-8 py-3.5 text-base font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90 shadow-lg shadow-[hsl(var(--primary)/0.3)]"
            >
              ابدأ التوليد الآن
            </Link>
            <Link
              href="/products"
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-8 py-3.5 text-base font-semibold hover:bg-[hsl(var(--muted))]"
            >
              تصفح المنتجات
            </Link>
          </div>
        </div>
        <div className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "أنواع المنتجات", value: "8+" },
            { label: "مستويات الجودة", value: "4" },
            { label: "أنظمة الدفع", value: "XRP + Demo" },
            { label: "Escrow حقيقي", value: "XRPL" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center"
            >
              <div className="text-3xl font-bold text-[hsl(var(--primary))]">{stat.value}</div>
              <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card)/0.5)] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold mb-12">لماذا NexusAI؟</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "توليد تلقائي ذكي",
                desc: "8 أنواع منتجات × 4 مستويات جودة. كتب، كود، تقارير، حملات تسويقية والمزيد.",
                icon: "🤖",
              },
              {
                title: "مدفوعات XRP + Escrow",
                desc: "دفع فوري بـ XRP مع Destination Tag، وتحقق عبر XRPSCAN، ونظام Escrow حقيقي على XRPL.",
                icon: "⚡",
              },
              {
                title: "اشتراكات وسوق وساطة",
                desc: "خطط Free / Pro / Enterprise + سوق للمطورين والتمويل والإشهار مع حماية Escrow.",
                icon: "🏪",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-8 hover:border-[hsl(var(--primary)/0.5)] transition-colors"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">جاهز للبدء؟</h2>
          <p className="mt-4 text-[hsl(var(--muted-foreground))]">
            أنشئ حسابًا مجانيًا وابدأ في توليد وبيع منتجاتك الرقمية خلال دقائق.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl bg-[hsl(var(--primary))] px-10 py-4 text-lg font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90"
          >
            إنشاء حساب مجاني
          </Link>
        </div>
      </section>
    </div>
  );
}
