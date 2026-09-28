import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : null;
    if (!userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const job = await prisma.escrowJob.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "الوظيفة غير موجودة" }, { status: 404 });
    }
    if (job.status !== "OPEN") {
      return NextResponse.json({ error: "الوظيفة غير متاحة للقبول" }, { status: 400 });
    }
    if (job.clientId === userId) {
      return NextResponse.json({ error: "لا يمكنك قبول وظيفتك" }, { status: 400 });
    }

    const changed = await prisma.escrowJob.updateMany({
      where: { id, status: "OPEN", clientId: { not: userId } },
      data: { providerId: userId, status: "IN_PROGRESS" },
    });
    if (changed.count !== 1) return NextResponse.json({ error: "تم قبول الوظيفة من مستخدم آخر" }, { status: 409 });
    const updated = await prisma.escrowJob.findUnique({ where: { id } });
    return NextResponse.json({ job: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل قبول الوظيفة" }, { status: 500 });
  }
}
