"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NewMarketplaceJobPage() {
  const { status } = useSession();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amountXrp, setAmountXrp] = useState("50");
  const [category, setCategory] = useState("development");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="mb-4">يجب تسجيل الدخول لنشر وظيفة</p>
        <Link href="/login" className="text-[hsl(var(--primary))] underline">تسجيل الدخول</Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/marketplace/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          amountXrp: Number(amountXrp),
          category,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل");
      router.push("/marketplace");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطأ");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">نشر وظيفة في سوق الوساطة</h1>
      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
        {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1.5">العنوان</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">الوصف</label>
          <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">المبلغ (XRP)</label>
          <input required type="number" min="1" step="0.1" value={amountXrp} onChange={(e) => setAmountXrp(e.target.value)} className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">الفئة</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm">
            <option value="development">تطوير</option>
            <option value="advertising">إشهار</option>
            <option value="financing">تمويل</option>
            <option value="design">تصميم</option>
            <option value="writing">كتابة</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-[hsl(var(--primary))] py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] disabled:opacity-50">
          {loading ? "جاري النشر..." : "نشر الوظيفة"}
        </button>
      </form>
    </div>
  );
}
