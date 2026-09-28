"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function BuyButton({ productId, priceXrp }: { productId: string; priceXrp: number }) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function buy() {
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الطلب");

      router.push(`/pay?orderId=${encodeURIComponent(data.order.id)}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="button"
        onClick={buy}
        disabled={loading}
        className="rounded-xl bg-[hsl(var(--primary))] px-6 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] disabled:opacity-50"
      >
        {loading ? "جاري إنشاء الطلب..." : `شراء الآن — ${priceXrp} XRP`}
      </button>
    </div>
  );
}
