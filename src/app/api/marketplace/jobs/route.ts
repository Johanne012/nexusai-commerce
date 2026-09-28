import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const jobs = await prisma.escrowJob.findMany({
    select: { id: true, title: true, description: true, amountXrp: true, status: true, category: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id?: string }).id : null;
    if (!userId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 5000) : "";
    const amountXrp = Number(body.amountXrp);
    const allowedCategories = ["development", "advertising", "financing", "design", "writing"];
    const category = typeof body.category === "string" && allowedCategories.includes(body.category) ? body.category : "development";

    if (!title || !description || !Number.isFinite(amountXrp) || amountXrp <= 0 || amountXrp > 10000000) {
      return NextResponse.json({ error: "عنوان ووصف ومبلغ صالح مطلوبان" }, { status: 400 });
    }

    const job = await prisma.escrowJob.create({
      data: {
        title,
        description,
        amountXrp,
        category,
        status: "OPEN",
        clientId: userId,
      },
    });

    return NextResponse.json({ job }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "فشل نشر الوظيفة" }, { status: 500 });
  }
}
