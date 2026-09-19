"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { PLANS, type PlanId } from "@/lib/subscriptions";

function PayContent() {
  const searchParams = useSearchParams();
  const planId = (searchParams.get("plan") || "pro") as PlanId;
  const plan = PLANS[planId] || PLANS.pro;

  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<{
    destinationAddress?: string;
    destinationTag?: number;
    amount: number;
    id: string;
  } | null>(null);
  const [error, setError] = useState("");

  async function createPayment() {
    setLoading(true);
    setError("");
    try {
      if (plan.priceXrp === 0) {
        window.location.href = "/dashboard";
        return;
      }
      const res = await fetch("/api/payments/xrp/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: plan.id,
          amount: plan.priceXrp,
          userId: "demo-user",
          metadata: { planId: plan.id },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إنشاء الدفع");
      setSession(data.session);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8">
        <h1 className="text-2xl font-bold mb-2">الدفع بـ XRP</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
          خطة: <strong>{plan.name}</strong> — {plan.priceXrp} XRP / شهر
        </p>

        {!session ? (
          <>
            <ul className="space-y-2 mb-6 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-[hsl(var(--success))]">✓</span> {f}
                </li>
              ))}
            </ul>
            {error && (
              <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={createPayment}
              disabled={loading}
              className="w-full rounded-xl bg-[hsl(var(--primary))] py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] disabled:opacity-50"
            >
              {loading ? "جاري التحضير..." : plan.priceXrp === 0 ? "تفعيل مجاني" : "إنشاء فاتورة XRP"}
            </button>
            <p className="mt-4 text-center text-xs text-[hsl(var(--muted-foreground))]">
              تأكد من ضبط PLATFORM_XRPL_ADDRESS في متغيرات البيئة
            </p>
          </>
        ) : (
          <div className="space-y-4 text-sm">
            <p className="text-[hsl(var(--success))]">✓ تم إنشاء الجلسة</p>
            <div className="rounded-xl bg-[hsl(var(--background))] p-4 space-y-2 font-mono text-xs break-all">
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">العنوان:</span>
                <br />
                {session.destinationAddress || "غير مضبوط"}
              </div>
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">Destination Tag:</span>{" "}
                {session.destinationTag}
              </div>
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">المبلغ:</span> {session.amount} XRP
              </div>
              <div>
                <span className="text-[hsl(var(--muted-foreground))]">معرف الجلسة:</span> {session.id}
              </div>
            </div>
            <p className="text-[hsl(var(--muted-foreground))]">
              أرسل المبلغ بالضبط مع الـ Tag، ثم استخدم API التحقق مع txHash.
            </p>
            <Link href="/dashboard" className="block text-center text-[hsl(var(--primary))] hover:underline">
              العودة للوحة التحكم
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">جاري التحميل...</div>}>
      <PayContent />
    </Suspense>
  );
}
