import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Database seed is disabled in production");
  const passwordHash = await bcrypt.hash(randomBytes(48).toString("hex"), 12);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@nexusai.dev" },
    update: {},
    create: {
      email: "demo@nexusai.dev",
      name: "Demo User",
      passwordHash,
      role: "USER",
      preferredLang: "ar",
      isVerified: true,
    },
  });

  const products = [
    {
      slug: "ai-ecommerce-guide",
      title: "دليل شامل: الذكاء الاصطناعي في التجارة الإلكترونية",
      description:
        "كتاب إلكتروني احترافي يشرح استخدام الذكاء الاصطناعي لزيادة المبيعات.",
      content: "# دليل التجارة الإلكترونية بالذكاء الاصطناعي\n\nمحتوى تجريبي...",
      productType: "ebook",
      qualityTier: "premium",
      priceXrp: 12.5,
      category: "education",
      language: "ar",
      creatorId: demoUser.id,
    },
    {
      slug: "marketing-campaign-xrp",
      title: "حملة تسويقية: منتجات XRP",
      description: "نصوص إعلانية جاهزة لحملات تسويق العملات الرقمية.",
      content: "نصوص تسويقية جاهزة...",
      productType: "marketing_copy",
      qualityTier: "standard",
      priceXrp: 4.2,
      category: "marketing",
      language: "ar",
      creatorId: demoUser.id,
    },
    {
      slug: "xrpl-payment-snippet",
      title: "مقطع برمجي: تكامل مدفوعات XRPL",
      description: "كود جاهز للتحقق من معاملات XRP عبر XRPSCAN.",
      content: "```ts\n// XRPL payment verification\n```",
      productType: "code_snippet",
      qualityTier: "premium",
      priceXrp: 7.8,
      category: "development",
      language: "ar",
      creatorId: demoUser.id,
    },
    {
      slug: "market-report-2026",
      title: "تقرير تحليلي: سوق المنتجات الرقمية 2026",
      description: "تقرير شامل مع بيانات ورؤى وتوصيات.",
      content: "# تقرير 2026\n\nتحليل السوق...",
      productType: "report",
      qualityTier: "enterprise",
      priceXrp: 18,
      category: "research",
      language: "ar",
      creatorId: demoUser.id,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  const existingJobs = await prisma.escrowJob.count();
  if (existingJobs === 0) {
    await prisma.escrowJob.createMany({
      data: [
        {
          title: "تطوير تكامل XRPL لمتجر إلكتروني",
          description:
            "مطلوب مطور لبناء نظام دفع XRP مع Destination Tags والتحقق عبر XRPSCAN.",
          amountXrp: 150,
          category: "development",
          status: "OPEN",
          clientId: demoUser.id,
        },
        {
          title: "حملة إعلانية لمنتج رقمي جديد",
          description: "تصميم وتنفيذ حملة تسويقية على منصات التواصل.",
          amountXrp: 80,
          category: "advertising",
          status: "OPEN",
          clientId: demoUser.id,
        },
        {
          title: "تمويل أولي لمشروع SaaS",
          description: "البحث عن تمويل أو شراكة لمشروع منصة ذكاء اصطناعي.",
          amountXrp: 500,
          category: "financing",
          status: "OPEN",
          clientId: demoUser.id,
        },
      ],
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
