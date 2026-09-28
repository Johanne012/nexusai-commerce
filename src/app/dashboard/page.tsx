import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as { id?: string }).id;

  const [productCount, orderCount, orders, subscription, recentLogs] =
    await Promise.all([
      prisma.product.count({
        where: userId ? { creatorId: userId, isActive: true } : { isActive: true },
      }),
      prisma.order.count({
        where: userId ? { userId } : undefined,
      }),
      prisma.order.findMany({
        where: userId ? { userId, status: "COMPLETED" } : { status: "COMPLETED" },
        select: { totalXrp: true },
      }),
      userId
        ? prisma.subscription.findFirst({
            where: { userId, status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
          })
        : null,
      prisma.aiGenerationLog.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const totalEarnings = orders.reduce((sum, o) => sum + o.totalXrp.toNumber(), 0);

  const stats = [
    { label: "المنتجات", value: String(productCount) },
    { label: "الطلبات", value: String(orderCount) },
    {
      label: "الأرباح (XRP)",
      value: totalEarnings.toFixed(1),
    },
    {
      label: "الاشتراك",
      value: subscription?.planId ?? "Free",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <p className="mt-1 text-[hsl(var(--muted-foreground))]">
          مرحبًا {session.user.name || session.user.email} — نظرة سريعة على
          نشاطك
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6"
          >
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              {s.label}
            </div>
            <div className="mt-1 text-3xl font-bold text-[hsl(var(--primary))]">
              {s.value}
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <h2 className="text-lg font-semibold mb-4">إجراءات سريعة</h2>
          <div className="space-y-3">
            <Link
              href="/generate"
              className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] px-4 py-3 hover:bg-[hsl(var(--muted))]"
            >
              <span>توليد منتج جديد</span>
              <span>←</span>
            </Link>
            <Link
              href="/marketplace"
              className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] px-4 py-3 hover:bg-[hsl(var(--muted))]"
            >
              <span>سوق الوساطة</span>
              <span>←</span>
            </Link>
            <Link
              href="/subscriptions"
              className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] px-4 py-3 hover:bg-[hsl(var(--muted))]"
            >
              <span>إدارة الاشتراك</span>
              <span>←</span>
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
          <h2 className="text-lg font-semibold mb-4">آخر النشاط</h2>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              لا يوجد نشاط بعد
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {recentLogs.map((log) => (
                <li key={log.id} className="flex items-center gap-3">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      log.status === "SUCCESS"
                        ? "bg-[hsl(var(--success))]"
                        : "bg-red-400"
                    }`}
                  />
                  توليد {log.productType} — {log.qualityTier}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
