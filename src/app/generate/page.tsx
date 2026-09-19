"use client";

import { useState } from "react";

const PRODUCT_TYPES = [
  { id: "ebook", labelAr: "كتاب إلكتروني" },
  { id: "marketing_copy", labelAr: "نصوص تسويقية" },
  { id: "code_snippet", labelAr: "مقاطع برمجية" },
  { id: "report", labelAr: "تقارير" },
  { id: "prompt_pack", labelAr: "حزم برومبتات" },
];

const QUALITY_TIERS = [
  { id: "basic", labelAr: "أساسي" },
  { id: "standard", labelAr: "قياسي" },
  { id: "premium", labelAr: "مميز" },
  { id: "enterprise", labelAr: "مؤسسي" },
];

export default function GeneratePage() {
  const [productType, setProductType] = useState("ebook");
  const [qualityTier, setQualityTier] = useState("standard");
  const [language, setLanguage] = useState("ar");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) { setError("يرجى إدخال الموضوع"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const isAr = language === "ar";
      const title = isAr ? `دليل شامل: ${topic}` : `Complete Guide to ${topic}`;
      const content = isAr
        ? `# ${title}\n\n## المقدمة\nهذا الدليل يشرح ${topic} بطريقة عملية.\n\n## الفصل 1\n...\n\n## الخلاصة\n...`
        : `# ${title}\n\n## Introduction\nA practical guide on ${topic}.\n\n## Chapter 1\n...`;
      const mult: Record<string, number> = { basic: 1, standard: 1.8, premium: 3.2, enterprise: 5.5 };
      setResult({
        title,
        description: isAr ? `منتج احترافي عن ${topic}` : `Professional product about ${topic}`,
        content,
        estimatedValueXrp: Math.round(8 * (mult[qualityTier] || 1) * 100) / 100,
        tags: [topic, productType, qualityTier],
      });
    } catch (err: any) {
      setError(err.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">توليد منتج بالذكاء الاصطناعي</h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">اختر النوع والجودة واللغة — وسنولّد لك منتجًا جاهزًا</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-5">
        <form onSubmit={handleGenerate} className="lg:col-span-2 space-y-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <div>
            <label className="block text-sm font-medium mb-1.5">نوع المنتج</label>
            <select value={productType} onChange={(e) => setProductType(e.target.value)}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm">
              {PRODUCT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.labelAr}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">مستوى الجودة</label>
            <select value={qualityTier} onChange={(e) => setQualityTier(e.target.value)}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm">
              {QUALITY_TIERS.map((t) => <option key={t.id} value={t.id}>{t.labelAr}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">اللغة</label>
            <div className="flex gap-2">
              {(["ar", "en"] as const).map((l) => (
                <button key={l} type="button" onClick={() => setLanguage(l)}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-medium ${
                    language === l ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]" : "border border-[hsl(var(--border))]"
                  }`}>{l === "ar" ? "العربية" : "English"}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">الموضوع *</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="مثال: التسويق عبر وسائل التواصل"
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm" />
          </div>
          {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-[hsl(var(--primary))] py-3.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] disabled:opacity-50">
            {loading ? "جاري التوليد..." : "توليد المنتج الآن"}
          </button>
        </form>
        <div className="lg:col-span-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 min-h-[400px]">
          {!result && !loading && (
            <div className="flex h-full min-h-[300px] items-center justify-center text-[hsl(var(--muted-foreground))]">
              <div className="text-center"><div className="text-5xl mb-4">✨</div><p>النتيجة ستظهر هنا</p></div>
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
                <div className="text-2xl font-bold text-[hsl(var(--primary))]">{result.estimatedValueXrp} XRP</div>
              </div>
              <div className="rounded-xl bg-[hsl(var(--background))] p-4 max-h-80 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">{result.content}</pre>
              </div>
              <button type="button" onClick={() => setResult(null)}
                className="rounded-xl border border-[hsl(var(--border))] px-4 py-2.5 text-sm hover:bg-[hsl(var(--muted))]">توليد جديد</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
