import Link from "next/link";
import { PLANS } from "@/lib/subscriptions";

export default function SubscriptionsPage() {
  const plans = Object.values(PLANS);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold">خطط الاشتراك</h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">اختر الخطة المناسبة — الدفع بـ XRP أو Demo</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const isPro = plan.id === "pro";
          return (
            <div key={plan.id} className={`relative rounded-2xl border p-8 flex flex-col ${
              isPro ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]" : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
            }`}>
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[hsl(var(--primary))] px-4 py-1 text-xs font-semibold text-[hsl(var(--primary-foreground))]">الأكثر شعبية</div>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{plan.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-bold">{plan.priceXrp}</span>
                <span className="text-[hsl(var(--muted-foreground))]"> XRP / شهر</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-[hsl(var(--success))] mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href={`/pay?plan=${plan.id}`} className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold ${
                isPro ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]"
              }`}>
                {plan.priceXrp === 0 ? "البدء مجانًا" : "اشترك الآن"}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
