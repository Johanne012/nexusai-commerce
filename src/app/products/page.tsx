import { ProductCard } from "@/components/products/ProductCard";
import { prisma } from "@/lib/prisma";
import { repriceProduct } from "@/lib/pricing/dynamic";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const typeCounts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.productType] = (acc[p.productType] || 0) + 1;
    return acc;
  }, {});

  const withPricing = products.map((p) => {
    const dyn = repriceProduct({
      productType: p.productType,
      qualityTier: p.qualityTier,
      listedPriceXrp: p.priceXrp.toNumber(),
      viewCount: p.viewCount,
      downloadCount: p.downloadCount,
      sameTypeCount: typeCounts[p.productType] || 1,
      createdAt: p.createdAt,
    });
    return { product: p, dyn };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">المنتجات الرقمية</h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">
          تسعير ديناميكي لوغاريتمي مستمر حسب الطلب والندرة والحداثة والجودة
        </p>
      </div>

      {withPricing.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">
            لا توجد منتجات بعد. استخدم صفحة التوليد أو{" "}
            <code className="text-[hsl(var(--primary))]">npm run db:seed</code>
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {withPricing.map(({ product: p, dyn }) => (
            <ProductCard
              key={p.id}
              id={p.id}
              slug={p.slug}
              title={p.title}
              description={p.description}
              priceXrp={p.priceXrp.toNumber()}
              productType={p.productType}
              qualityTier={p.qualityTier}
              dynamicPriceXrp={dyn.priceXrp}
              priceLabel={dyn.label}
              priceHint={dyn.explanationAr}
            />
          ))}
        </div>
      )}
    </div>
  );
}
