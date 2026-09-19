import { ProductCard } from "@/components/products/ProductCard";

const DEMO_PRODUCTS = [
  { id: "1", slug: "ai-ecommerce-guide", title: "دليل شامل: الذكاء الاصطناعي في التجارة الإلكترونية", description: "كتاب إلكتروني احترافي يشرح استخدام الذكاء الاصطناعي لزيادة المبيعات.", priceXrp: 12.5, productType: "ebook", qualityTier: "premium" },
  { id: "2", slug: "marketing-campaign-xrp", title: "حملة تسويقية: منتجات XRP", description: "نصوص إعلانية جاهزة لحملات تسويق العملات الرقمية.", priceXrp: 4.2, productType: "marketing_copy", qualityTier: "standard" },
  { id: "3", slug: "xrpl-payment-snippet", title: "مقطع برمجي: تكامل مدفوعات XRPL", description: "كود جاهز للتحقق من معاملات XRP عبر XRPSCAN.", priceXrp: 7.8, productType: "code_snippet", qualityTier: "premium" },
  { id: "4", slug: "market-report-2026", title: "تقرير تحليلي: سوق المنتجات الرقمية 2026", description: "تقرير شامل مع بيانات ورؤى وتوصيات.", priceXrp: 18, productType: "report", qualityTier: "enterprise" },
];

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">المنتجات الرقمية</h1>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">منتجات مولّدة بالذكاء الاصطناعي — جاهزة للشراء بـ XRP</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_PRODUCTS.map((p) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </div>
    </div>
  );
}
