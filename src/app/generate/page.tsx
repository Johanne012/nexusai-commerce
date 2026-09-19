"use client";

import { useState } from "react";
import {
  generateProduct,
  PRODUCT_TYPES,
  QUALITY_TIERS,
  type ProductType,
  type QualityTier,
} from "@/lib/ai/generator";

export default function GeneratePage() {
  const [productType, setProductType] = useState<ProductType>("ebook");
  const [qualityTier, setQualityTier] = useState<QualityTier>("standard");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    description: string;
    content: string;
    estimatedValueXrp: number;
    tags: string[];
  } | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) {
      setError("يرجى إدخال الموضوع");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const generated = await generateProduct({
        productType,
        qualityTier,
        language,
        topic: topic.trim(),
      });
      setResult({
        title: generated.title,
        description: generated.description,
        content: generated.content,
        estimatedValueXrp: generated.estimatedValueXrp,
        tags: generated.tags,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء التوليد");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">توليد منتج بالذكاء الاصطناعي</h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">
          اختر النوع والجودة واللغة — وسنولّد لك منتجًا جاهزًا للبيع
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
              placeholder="مثال: التسويق عبر وسائل التواصل"
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm"
            />
          </div>

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
            {loading ? "جاري التوليد..." : "توليد المنتج الآن"}
          </button>
        </form>

        <div className="lg:col-span-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 min-h-[400px]">
          {!result && !loading && (
            <div className="flex h-full min-h-[300px] items-center justify-center text-[hsl(var(--muted-foreground))]">
              <div className="text-center">
                <div className="text-5xl mb-4">✨</div>
                <p>النتيجة ستظهر هنا</p>
              </div>
            </div>
          )}
          {loading && (
            <div className="flex h-full min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
                <p className="mt-4 text-[hsl(var(--muted-foreground))]">الذكاء الاصطناعي يعمل...</p>
              </div>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{result.title}</h2>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{result.description}</p>
                </div>
                <div className="text-2xl font-bold text-[hsl(var(--primary))] shrink-0">
                  {result.estimatedValueXrp} XRP
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-[hsl(var(--muted))] px-2 py-0.5 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="rounded-xl bg-[hsl(var(--background))] p-4 max-h-80 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">{result.content}</pre>
              </div>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="rounded-xl border border-[hsl(var(--border))] px-4 py-2.5 text-sm hover:bg-[hsl(var(--muted))]"
              >
                توليد جديد
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
