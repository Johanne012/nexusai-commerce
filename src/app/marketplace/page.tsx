import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AcceptJobButton } from "@/components/marketplace/AcceptJobButton";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  OPEN: "مفتوح",
  FUNDED: "ممول",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغى",
};

const categoryLabels: Record<string, string> = {
  development: "تطوير",
  advertising: "إشهار",
  financing: "تمويل",
  design: "تصميم",
  writing: "كتابة",
};

export default async function MarketplacePage() {
  const jobs = await prisma.escrowJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold">سوق الوساطة</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            سوق وظائف مستقل؛ لا تتم إدارة الأموال أو ضمانها عبر المنصة
          </p>
        </div>
        <Link
          href="/marketplace/new"
          className="rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-[hsl(var(--primary-foreground))] text-center"
        >
          + نشر وظيفة جديدة
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">
            لا توجد وظائف بعد. شغّل{" "}
            <code className="text-[hsl(var(--primary))]">npm run db:seed</code>{" "}
            أو انشر وظيفة جديدة.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="rounded-md bg-[hsl(var(--muted))] px-2 py-0.5 text-xs">
                      {categoryLabels[job.category] || job.category}
                    </span>
                    <span className="rounded-md bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))] px-2 py-0.5 text-xs">
                      {statusLabels[job.status] || job.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                    {job.description}
                  </p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-2xl font-bold text-[hsl(var(--primary))]">
                    {job.amountXrp.toString()}{" "}
                    <span className="text-sm font-normal">XRP</span>
                  </div>
                  <AcceptJobButton jobId={job.id} status={job.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
