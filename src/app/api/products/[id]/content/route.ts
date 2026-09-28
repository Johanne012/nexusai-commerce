import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : undefined;
  if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true, content: true, creatorId: true, isActive: true } });
  if (!product || !product.isActive) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
  const isCreator = product.creatorId === userId;
  const orderItem = isCreator ? null : await prisma.orderItem.findFirst({ where: { productId: id, order: { userId, status: "COMPLETED" } }, select: { id: true } });
  if (!isCreator && !orderItem) return NextResponse.json({ error: "يجب شراء المنتج للوصول إلى المحتوى" }, { status: 403 });
  await prisma.product.update({ where: { id }, data: { downloadCount: { increment: 1 } } });
  return NextResponse.json({ content: product.content }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
