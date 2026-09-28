import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { repriceProduct } from "@/lib/pricing/dynamic";

const asNumber = (value: { toNumber(): number } | number) => typeof value === "number" ? value : value.toNumber();
function orderNumber() { return `ORD-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`; }

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : null;
    if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    const body = await req.json().catch(() => null);
    const productId = typeof body?.productId === "string" ? body.productId : "";
    if (!productId || productId.length > 100) return NextResponse.json({ error: "productId غير صالح" }, { status: 400 });

    const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
    if (!product) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
    const sameType = await prisma.product.count({ where: { productType: product.productType, isActive: true } });
    const quote = repriceProduct({
      productType: product.productType,
      qualityTier: product.qualityTier,
      listedPriceXrp: asNumber(product.priceXrp),
      viewCount: product.viewCount,
      downloadCount: product.downloadCount,
      sameTypeCount: sameType,
      createdAt: product.createdAt,
    });
    const rate = Number(process.env.XRP_USD_RATE || "0.6");
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("XRP_USD_RATE is invalid");
    const totalUsd = Math.round(quote.priceXrp * rate * 100) / 100;
    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        userId,
        status: "PENDING",
        totalXrp: quote.priceXrp,
        totalUsd,
        paymentProvider: "pending",
        items: { create: { productId: product.id, quantity: 1, priceXrp: quote.priceXrp, priceUsd: totalUsd } },
      },
      include: { items: true },
    });
    return NextResponse.json({ order, pricing: quote }, { status: 201 });
  } catch (e) {
    console.error("orders/create", e);
    return NextResponse.json({ error: "فشل إنشاء الطلب" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : null;
  if (!userId) return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  const orders = await prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { items: { include: { product: { select: { id: true, slug: true, title: true, description: true, productType: true } } } }, payments: { select: { id: true, provider: true, amount: true, currency: true, status: true, createdAt: true } } }, take: 50 });
  return NextResponse.json({ orders });
}
