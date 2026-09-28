"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PRODUCT_TYPES,
  QUALITY_TIERS,
  type ProductType,
  type QualityTier,
} from "@/lib/ai/generator";

interface GenResult {
  title: string;
  description: string;
  content: string;
  estimatedValueXrp: number;
  tags: string[];
  commerceAngle?: string;
}

export default function GeneratePage() {
  const [productType, setProductType] = useState<ProductType>("ebook");
  const [qualityTier, setQualityTier] = useState<QualityTier>("standard");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [extra, setExtra] = useState("");
  const [publish, setPublish] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenResult | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [usedOpenAI, setUsedOpenAI] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) {
      setError("يرجى إدخال الموضوع");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    setProductId(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          qualityTier,
          language,
          topic: topic.trim(),
          targetAudience: audience.trim() || undefined,
          extraInstructions: extra.trim() || undefined,
          publish,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "فشل التوليد");
        return;
      }
      setResult(data.result);
      setUsedOpenAI(Boolean(data.usedOpenAI));
      if (data.product?.id) setProductId(data.product.id);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">توليد منتج تجاري بالذكاء الاصطناعي</h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">
          منتج رقمي جاهز للبيع: عنوان، وصف، محتوى، وسوم، وتسعير XRP — مع خيار النشر في المتجر فوراً
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-2 space-y-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
        >
          <div>
            <label className="block text-sm font-medium mb-1.5">نوع المنتج</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value as ProductType)}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm"
            >
              {PRODUCT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.labelAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">مستوى الجودة</label>
            <select
              value={qualityTier}
              onChange={(e) => setQualityTier(e.target.value as QualityTier)}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm"
            >
              {QUALITY_TIERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.labelAr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">اللغة</label>
            <div className="flex gap-2">
              {(["ar", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium ${
                    language === l
                      ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                      : "border border-[hsl(var(--border))]"
                  }`}
                >
                  {l === "ar" ? "العربية" : "English"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">الموضوع *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: استخدام الذكاء الاصطناعي في التجارة الإلكترونية"
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">الجمهور المستهدف</label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="مثال: أصحاب متاجر صغيرة"
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">تعليمات إضافية</label>
            <textarea
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              rows={2}
              placeholder="ركز على أمثلة عربية، أو أضف جدول أسعار..."
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="rounded"
            />
            نشر المنتج في المتجر تلقائياً بعد التوليد
          </label>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[hsl(var(--primary))] py-3.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] disabled:opacity-50"
          >
            {loading ? "جاري التوليد التجاري..." : "توليد منتج جاهز للبيع"}
          </button>
        </form>

        <div className="lg:col-span-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 min-h-[400px]">
          {!result && !loading && (
            <div className="flex h-full min-h-[300px] items-center justify-center text-[hsl(var(--muted-foreground))]">
              <div className="text-center max-w-sm">
                <div className="text-5xl mb-4">🛒</div>
                <p className="font-medium text-[hsl(var(--foreground))]">محرك التجارة بالذكاء الاصطناعي</p>
                <p className="mt-2 text-sm">
                  اختر النوع والجودة واكتب موضوعاً تجارياً — سنولّد منتجاً قابلاً للبيع فوراً بـ XRP
                </p>
              </div>
            </div>
          )}
          {loading && (
            <div className="flex h-full min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
                <p className="mt-4 text-[hsl(var(--muted-foreground))]">
                  تحليل الطلب التجاري وتوليد المحتوى...
                </p>
              </div>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{result.title}</h2>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {result.description}
                  </p>
                  {result.commerceAngle && (
                    <p className="mt-2 text-xs text-[hsl(var(--primary))]">
                      زاوية البيع: {result.commerceAngle}
                    </p>
                  )}
                </div>
                <div className="text-2xl font-bold text-[hsl(var(--primary))] shrink-0">
                  {result.estimatedValueXrp} XRP
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {result.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-[hsl(var(--muted))] px-2 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {usedOpenAI && (
                  <span className="rounded-md bg-emerald-500/15 text-emerald-400 px-2 py-0.5 text-xs">
                    OpenAI
                  </span>
                )}
                {!usedOpenAI && (
                  <span className="rounded-md bg-amber-500/15 text-amber-400 px-2 py-0.5 text-xs">
                    قالب تجاري محسّن
                  </span>
                )}
              </div>
              <div className="rounded-xl bg-[hsl(var(--background))] p-4 max-h-80 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">{result.content}</pre>
              </div>
              <div className="flex flex-wrap gap-3">
                {productId && (
                  <Link
                    href="/products"
                    className="rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--primary-foreground))]"
                  >
                    عرض في المتجر ←
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setProductId(null);
                  }}
                  className="rounded-xl border border-[hsl(var(--border))] px-4 py-2.5 text-sm hover:bg-[hsl(var(--muted))]"
                >
                  توليد جديد
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
