import Link from "next/link";

const DEMO_JOBS = [
  { id: "1", title: "تطوير تكامل XRPL لمتجر إلكتروني", description: "مطلوب مطور لبناء نظام دفع XRP مع Destination Tags والتحقق عبر XRPSCAN.", amountXrp: 150, category: "development", status: "OPEN" },
  { id: "2", title: "حملة إعلانية لمنتج رقمي جديد", description: "تصميم وتنفيذ حملة تسويقية على منصات التواصل.", amountXrp: 80, category: "advertising", status: "OPEN" },
  { id: "3", title: "تمويل أولي لمشروع SaaS", description: "البحث عن تمويل أو شراكة لمشروع منصة ذكاء اصطناعي.", amountXrp: 500, category: "financing", status: "FUNDED" },
];

const statusLabels: Record<string, string> = { OPEN: "مفتوح", FUNDED: "ممول", IN_PROGRESS: "قيد التنفيذ" };
const categoryLabels: Record<string, string> = { development: "تطوير", advertising: "إشهار", financing: "تمويل" };

export default function MarketplacePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold">سوق الوساطة</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">وظائف محمية بنظام Escrow على XRPL</p>
        </div>
        <Link href="/marketplace/new" className="rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] text-center">
          + نشر وظيفة جديدة
        </Link>
      </div>
      <div className="space-y-4">
        {DEMO_JOBS.map((job) => (
          <div key={job.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="rounded-md bg-[hsl(var(--muted))] px-2 py-0.5 text-xs">{categoryLabels[job.category]}</span>
                  <span className="rounded-md bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] px-2 py-0.5 text-xs">{statusLabels[job.status]}</span>
                </div>
                <h3 className="text-lg font-semibold">{job.title}</h3>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{job.description}</p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <div className="text-2xl font-bold text-[hsl(var(--primary))]">{job.amountXrp} <span className="text-sm font-normal">XRP</span></div>
                <button className="mt-3 rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm hover:bg-[hsl(var(--muted))]">عرض التفاصيل</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
