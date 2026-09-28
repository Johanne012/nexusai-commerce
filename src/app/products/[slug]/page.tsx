import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { repriceProduct } from "@/lib/pricing/dynamic";
import { BuyButton } from "./BuyButton";
import { ProductContentAccess } from "@/components/products/ProductContentAccess";

export const dynamic = "force-dynamic";
const asNumber = (value: { toNumber(): number } | number) => typeof value === "number" ? value : value.toNumber();

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({ where: { slug, isActive: true } });
  if (!product) notFound();
  await prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } });
  const sameType = await prisma.product.count({ where: { productType: product.productType, isActive: true } });
  const listedPrice = asNumber(product.priceXrp);
  const dyn = repriceProduct({ productType: product.productType, qualityTier: product.qualityTier, listedPriceXrp: listedPrice, viewCount: product.viewCount + 1, downloadCount: product.downloadCount, sameTypeCount: sameType, createdAt: product.createdAt });
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href="/products" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]">← العودة للمنتجات</Link>
      <div className="mt-6 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8">
        <div className="flex flex-wrap gap-2 mb-4"><span className="rounded-md bg-[hsl(var(--muted))] px-2 py-0.5 text-xs">{product.productType}</span><span className="rounded-md bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] px-2 py-0.5 text-xs">{product.qualityTier}</span>{product.isAiGenerated && <span className="rounded-md bg-emerald-500/15 text-emerald-400 px-2 py-0.5 text-xs">AI</span>}</div>
        <h1 className="text-3xl font-bold">{product.title}</h1>
        <p className="mt-3 text-[hsl(var(--muted-foreground))]">{product.description}</p>
        <div className="mt-6 flex flex-wrap items-end gap-4 justify-between">
          <div><div className="text-3xl font-bold text-[hsl(var(--primary))]">{dyn.priceXrp} <span className="text-base font-normal">XRP</span></div>{Math.abs(dyn.priceXrp - listedPrice) > 0.05 && <div className="text-sm text-[hsl(var(--muted-foreground))] line-through">{listedPrice} XRP</div>}<p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{dyn.explanationAr}</p></div>
          <BuyButton productId={product.id} priceXrp={dyn.priceXrp} />
        </div>
        <ProductContentAccess productId={product.id} preview={product.content.slice(0, 600)} />
      </div>
    </div>
  );
}
