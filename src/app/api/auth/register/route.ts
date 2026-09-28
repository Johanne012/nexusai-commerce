import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = z.object({ name: z.string().trim().max(100).optional(), email: z.string().trim().email().max(254), password: z.string().min(10).max(128) }).safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "أدخل بريدًا صالحًا وكلمة مرور بين 10 و128 حرفًا" }, { status: 400 });
    const name = parsed.data.name || "";
    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    if (password.length < 10) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "هذا البريد مسجل مسبقاً" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء التسجيل" },
      { status: 500 }
    );
  }
}
