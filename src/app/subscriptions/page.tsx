import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;

  const active = userId
    ? await prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE", currentPeriodEnd: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold mb-2">الاشتراكات</h1>
      <p className="text-[hsl(var(--muted-foreground))] mb-10">
        تُفعّل الخطة بعد تأكيد الدفع. Stripe يتجدد شهريًا تلقائيًا؛ أما XRP فيحتاج إلى تجديد شهري يدوي.
      </p>

      {active && (
        <div className="mb-8 rounded-2xl border border-[hsl(var(--primary)/0.4)] bg-[hsl(var(--primary)/0.08)] p-5 text-sm">
          اشتراكك الحالي: <strong>{active.planId}</strong> — {active.cancelAtPeriodEnd ? "سيتوقف عند" : "ساري حتى"}{" "}
          {new Date(active.currentPeriodEnd).toLocaleDateString("ar")}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {Object.values(PLANS).map((plan) => {
          const isCurrent = active?.planId === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col ${
                isCurrent
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--card))]"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              }`}
            >
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{plan.description}</p>
              <div className="mt-4 text-3xl font-bold text-[hsl(var(--primary))]">
                {plan.priceXrp === 0 ? "مجاني" : `${plan.priceXrp} XRP`}
                {plan.priceXrp > 0 && <span className="text-sm font-normal">/شهر</span>}
              </div>
              <ul className="mt-4 space-y-2 text-sm flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-[hsl(var(--success))]">✓</span> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="mt-6 rounded-xl border border-[hsl(var(--border))] py-2.5 text-center text-sm">خطتك الحالية</div>
              ) : (
                <Link
                  href={`/pay?plan=${plan.id}`}
                  className="mt-6 block rounded-xl bg-[hsl(var(--primary))] py-2.5 text-center text-sm font-semibold text-[hsl(var(--primary-foreground))]"
                >
                  {plan.priceXrp === 0 ? "تفعيل" : "اشترك وادفع"}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
