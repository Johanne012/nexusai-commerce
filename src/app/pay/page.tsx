"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { PLANS, type PlanId } from "@/lib/subscriptions";

type ProviderInfo = { id: string; available: boolean; label: string };
type Quote = { xrp: number; usd: number };
type PaySession = { id: string; provider: string; destinationAddress?: string; destinationTag?: number; amount: number; currency: string; paymentUrl?: string };

function PayContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const planId = (searchParams.get("plan") || "") as PlanId | "";
  const orderId = searchParams.get("orderId") || "";
  const stripeStatus = searchParams.get("status");
  const stripeSessionId = searchParams.get("session_id");
  const plan = planId && PLANS[planId] ? PLANS[planId] : null;
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [provider, setProvider] = useState("auto");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [paySession, setPaySession] = useState<PaySession | null>(null);
  const [paymentId, setPaymentId] = useState("");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (orderId) params.set("orderId", orderId);
    if (planId) params.set("planId", planId);
    fetch(`/api/payments/create${params.size ? `?${params}` : ""}`)
      .then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "تعذر تحميل السعر"); return d; })
      .then((d) => {
        setProviders(d.providers || []);
        if (d.quote) setQuote(d.quote);
        const preferred = (d.providers || []).find((p: ProviderInfo) => p.available && p.id === "stripe") || (d.providers || []).find((p: ProviderInfo) => p.available && p.id === "xrp") || (d.providers || []).find((p: ProviderInfo) => p.available);
        if (preferred) setProvider(preferred.id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "تعذر تحميل الدفع"));
  }, [orderId, planId]);

  useEffect(() => {
    if (stripeStatus !== "success" || !stripeSessionId) return;
    fetch("/api/payments/verify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "stripe", sessionId: stripeSessionId }),
    }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "تعذر التحقق"); return d; })
      .then((d) => { if (d.success) setDone(true); else setError("لم يؤكد Stripe الدفع بعد؛ أعد المحاولة بعد قليل."); })
      .catch((e) => setError(e instanceof Error ? e.message : "فشل التحقق"))
      .finally(() => setVerifying(false));
  }, [stripeStatus, stripeSessionId]);

  async function activateFree() {
    const response = await fetch("/api/subscriptions/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: "free" }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "فشل تفعيل الخطة المجانية");
    setDone(true);
  }

  async function createPayment() {
    if (status !== "authenticated") { router.push("/login"); return; }
    setLoading(true); setError("");
    try {
      if (plan?.id === "free") { await activateFree(); return; }
      if (!orderId && !planId) throw new Error("لم يُحدد طلب أو اشتراك للدفع");
      const response = await fetch("/api/payments/create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider === "auto" ? undefined : provider, orderId: orderId || undefined, planId: planId || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "فشل إنشاء جلسة الدفع");
      setPaySession(data.session); setPaymentId(data.paymentId);
      if (data.provider === "stripe" && data.session.paymentUrl) { window.location.assign(data.session.paymentUrl); return; }
      if (data.provider === "demo") {
        const verify = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "demo", paymentId: data.paymentId }) });
        const result = await verify.json();
        if (!verify.ok || !result.success) throw new Error(result.error || "فشل الدفع التجريبي");
        setDone(true);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "حدث خطأ غير متوقع"); }
    finally { setLoading(false); }
  }

  async function verifyXrp() {
    if (!/^[a-fA-F0-9]{64}$/.test(txHash.trim())) { setError("أدخل Hash صحيحًا من 64 خانة سداسية عشرية"); return; }
    setVerifying(true); setError("");
    try {
      const response = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: "xrp", paymentId, txHash: txHash.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "فشل التحقق");
      if (data.success) setDone(true); else setError("لم يتم تأكيد المعاملة بعد. تأكد من الدفع للعنوان والوسم والمبلغ المعروض.");
    } catch (e) { setError(e instanceof Error ? e.message : "فشل التحقق"); }
    finally { setVerifying(false); }
  }

  const isFree = plan?.id === "free";
  const stripeVerifying = stripeStatus === "success" && Boolean(stripeSessionId) && !done && !error;
  const displayAmount = provider === "stripe" ? quote?.usd : quote?.xrp;
  const displayCurrency = provider === "stripe" ? "USD" : "XRP";
  if (done) return <div className="mx-auto max-w-lg px-4 py-12 text-center"><div className="rounded-2xl border bg-[hsl(var(--card))] p-8"><div className="text-4xl mb-4 text-[hsl(var(--success))]">✓</div><h1 className="text-2xl font-bold mb-2">تم تأكيد العملية</h1><p className="mb-6 text-[hsl(var(--muted-foreground))]">تم تحديث الطلب أو الاشتراك على الخادم.</p>{orderId && <Link className="mr-4 underline" href={`/products`}>العودة للمتجر</Link>}<Link href="/dashboard" className="underline">لوحة التحكم</Link></div></div>;

  return <div className="mx-auto max-w-lg px-4 py-12"><div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8">
    <h1 className="text-2xl font-bold mb-2">إتمام الدفع</h1>
    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">{plan ? <>خطة <strong>{plan.name}</strong></> : orderId ? "طلب منتج" : "لم يُحدد طلب"}</p>
    {quote && !paySession && !isFree && <p className="mb-5 text-lg font-semibold">السعر الحالي: {displayAmount?.toFixed(2)} {displayCurrency}{provider === "stripe" && quote.xrp > 0 && <span className="block text-xs font-normal text-[hsl(var(--muted-foreground))]">ما يعادل {quote.xrp.toFixed(6)} XRP</span>}</p>}
    {!paySession ? <>
      {providers.length > 0 && !isFree && <fieldset className="mb-5 space-y-2"><legend className="text-sm font-medium">وسيلة الدفع</legend>{providers.map((p) => <label key={p.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer ${!p.available ? "opacity-40" : ""}`}><input type="radio" name="provider" checked={provider === p.id} disabled={!p.available} onChange={() => setProvider(p.id)} /><span>{p.label}</span>{!p.available && <span className="text-xs">(غير مُعدّ)</span>}</label>)}</fieldset>}
      {error && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
      <button type="button" onClick={createPayment} disabled={loading || verifying || stripeVerifying || status === "loading" || (!isFree && !quote)} className="w-full rounded-xl bg-[hsl(var(--primary))] py-3 text-sm font-semibold disabled:opacity-50">{loading || verifying || stripeVerifying ? "جاري المعالجة…" : isFree ? "تفعيل الخطة المجانية" : "متابعة الدفع"}</button>
    </> : <div className="space-y-4 text-sm">
      <div className="rounded-xl bg-[hsl(var(--background))] p-4 space-y-2 break-all">{paySession.destinationAddress && <><div>العنوان: <strong>{paySession.destinationAddress}</strong></div><div>Destination Tag: <strong>{paySession.destinationTag}</strong></div></>}<div>المبلغ: <strong>{paySession.amount} {paySession.currency}</strong></div><div>المزود: {paySession.provider}</div></div>
      <p>بعد إرسال XRP، أدخل Transaction Hash:</p><input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="64-character Transaction Hash" className="w-full rounded-xl border bg-[hsl(var(--background))] px-4 py-2.5 text-sm" />
      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}
      <button type="button" onClick={verifyXrp} disabled={verifying} className="w-full rounded-xl bg-[hsl(var(--primary))] py-3 text-sm font-semibold disabled:opacity-50">{verifying ? "جارٍ التحقق…" : "تحقق من الدفع"}</button>
    </div>}
    {status === "unauthenticated" && <p className="mt-4 text-center text-sm"><Link href="/login" className="underline">سجّل الدخول أولًا</Link></p>}
  </div></div>;
}

export default function PayPage() { return <Suspense fallback={<div className="p-12 text-center">…</div>}><PayContent /></Suspense>; }
