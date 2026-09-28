import Link from "next/link";

export interface ProductCardProps {
  id: string;
  slug: string;
  title: string;
  description: string;
  priceXrp: number;
  productType: string;
  qualityTier: string;
  /** Optional dynamic pricing display */
  dynamicPriceXrp?: number;
  priceLabel?: "normal" | "hot" | "discount" | "premium";
  priceHint?: string;
}

const typeLabels: Record<string, string> = {
  ebook: "كتاب إلكتروني",
  marketing_copy: "نصوص تسويقية",
  code_snippet: "كود",
  product_desc: "وصف منتج",
  report: "تقرير",
  service_package: "باقة خدمات",
  prompt_pack: "حزمة برومبت",
  api_template: "قالب API",
};

const tierColors: Record<string, string> = {
  basic: "bg-slate-500/20 text-slate-300",
  standard: "bg-blue-500/20 text-blue-300",
  premium: "bg-purple-500/20 text-purple-300",
  enterprise: "bg-amber-500/20 text-amber-300",
};

const priceBadge: Record<string, string> = {
  hot: "bg-orange-500/20 text-orange-300",
  premium: "bg-emerald-500/20 text-emerald-300",
  discount: "bg-sky-500/20 text-sky-300",
  normal: "",
};

export function ProductCard({
  id,
  slug,
  title,
  description,
  priceXrp,
  productType,
  qualityTier,
  dynamicPriceXrp,
  priceLabel = "normal",
  priceHint,
}: ProductCardProps) {
  const display = dynamicPriceXrp ?? priceXrp;
  const showStrike = dynamicPriceXrp != null && Math.abs(dynamicPriceXrp - priceXrp) > 0.05;

  return (
    <Link
      href={`/products/${slug || id}`}
      className="group flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden hover:border-[hsl(var(--primary)/0.5)] transition-all"
    >
      <div className="h-36 bg-gradient-to-br from-[hsl(var(--primary)/0.2)] to-[hsl(var(--muted))] flex items-center justify-center relative">
        <span className="text-5xl opacity-60">📦</span>
        {priceLabel !== "normal" && (
          <span
            className={`absolute top-3 left-3 rounded-md px-2 py-0.5 text-xs ${priceBadge[priceLabel]}`}
          >
            {priceLabel === "hot"
              ? "طلب مرتفع"
              : priceLabel === "premium"
                ? "سعر مميز"
                : priceLabel === "discount"
                  ? "تخفيض"
                  : ""}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-md bg-[hsl(var(--muted))] px-2 py-0.5 text-xs">
            {typeLabels[productType] || productType}
          </span>
          <span
            className={`rounded-md px-2 py-0.5 text-xs ${tierColors[qualityTier] || ""}`}
          >
            {qualityTier}
          </span>
        </div>
        <h3 className="font-semibold text-lg leading-snug group-hover:text-[hsl(var(--primary))] line-clamp-2">
          {title}
        </h3>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 flex-1">
          {description}
        </p>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[hsl(var(--primary))]">
                {display} <span className="text-sm font-normal">XRP</span>
              </span>
              {showStrike && (
                <span className="text-sm text-[hsl(var(--muted-foreground))] line-through">
                  {priceXrp}
                </span>
              )}
            </div>
            {priceHint && (
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                {priceHint}
              </p>
            )}
          </div>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">عرض ←</span>
        </div>
      </div>
    </Link>
  );
}
