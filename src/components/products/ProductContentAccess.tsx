"use client";

import { useState } from "react";

export function ProductContentAccess({ productId, preview }: { productId: string; preview: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function openContent() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/content`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر الوصول للمحتوى");
      setContent(data.content);
    } catch (e) { setError(e instanceof Error ? e.message : "تعذر الوصول للمحتوى"); }
    finally { setBusy(false); }
  }
  return (
    <div className="mt-10 rounded-xl bg-[hsl(var(--background))] p-6">
      {content == null ? <>
        <h2 className="font-semibold mb-3">معاينة مجانية</h2>
        <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{preview}{preview.length >= 600 ? "…" : ""}</pre>
        <button type="button" onClick={openContent} disabled={busy} className="mt-5 rounded-xl border px-4 py-2 text-sm disabled:opacity-50">{busy ? "جارٍ التحقق…" : "لديّ حق الوصول — عرض المحتوى"}</button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </> : <>
        <h2 className="font-semibold mb-3">محتوى المنتج</h2>
        <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{content}</pre>
      </>}
    </div>
  );
}
