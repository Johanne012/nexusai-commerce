import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="mt-1 text-[hsl(var(--muted-foreground))]">مرحبًا بك — نظرة سريعة على نشاطك</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {[
          { label: "المنتجات", value: "6" },
          { label: "الطلبات", value: "12" },
          { label: "الأرباح (XRP)", value: "84.5" },
          { label: "الاشتراك", value: "Pro" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
            <div className="text-sm text-[hsl(var(--muted-foreground))]">{s.label}</div>
            <div className="mt-1 text-3xl font-bold text-[hsl(var(--primary))]">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <h2 className="text-lg font-semibold mb-4">إجراءات سريعة</h2>
          <div className="space-y-3">
            <Link href="/generate" className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] px-4 py-3 hover:bg-[hsl(var(--muted))]">
              <span>توليد منتج جديد</span><span>←</span>
            </Link>
            <Link href="/marketplace" className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] px-4 py-3 hover:bg-[hsl(var(--muted))]">
              <span>سوق الوساطة</span><span>←</span>
            </Link>
            <Link href="/subscriptions" className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] px-4 py-3 hover:bg-[hsl(var(--muted))]">
              <span>إدارة الاشتراك</span><span>←</span>
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <h2 className="text-lg font-semibold mb-4">آخر النشاط</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" />تم توليد منتج جديد</li>
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />دفعة XRP مستلمة — 12.5 XRP</li>
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-amber-400" />وظيفة جديدة في السوق</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
