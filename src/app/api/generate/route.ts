import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateProduct, type ProductType, type QualityTier } from "@/lib/ai/generator";
import { computeDynamicPrice } from "@/lib/pricing/dynamic";
import { getPlan } from "@/lib/subscriptions";

const schema = z.object({
  productType: z.enum(["ebook", "marketing_copy", "code_snippet", "product_desc", "report", "service_package", "prompt_pack", "api_template"]),
  qualityTier: z.enum(["basic", "standard", "premium", "enterprise"]).default("standard"),
  language: z.enum(["ar", "en", "fr", "es"]).default("ar"),
  topic: z.string().trim().min(2).max(300),
  extraInstructions: z.string().max(2000).optional(),
  targetAudience: z.string().max(200).optional(),
  publish: z.boolean().default(false),
});

function monthPeriod(date = new Date()) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as { id?: string }).id : undefined;
  if (!userId) return NextResponse.json({ error: "سجّل الدخول لاستخدام التوليد" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "بيانات التوليد غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const now = new Date();
  const activeSubscription = await prisma.subscription.findFirst({
    where: { userId, status: "ACTIVE", currentPeriodEnd: { gt: now } },
    orderBy: { currentPeriodEnd: "desc" },
  });
  const plan = getPlan(activeSubscription?.planId || "free");
  if (input.publish) {
    const productCount = await prisma.product.count({ where: { creatorId: userId, isActive: true } });
    if (productCount >= plan.maxProducts) return NextResponse.json({ error: `حد خطتك ${plan.maxProducts} منتجًا منشورًا` }, { status: 403 });
  }

  const period = monthPeriod(now);
  let reserved = false;
  try {
    const usage = await prisma.aiUsageCounter.upsert({
      where: { userId_period: { userId, period } },
      create: { userId, period, aiGenerations: 1 },
      update: { aiGenerations: { increment: 1 } },
    });
    if (usage.aiGenerations > plan.maxAiGenerations) {
      await prisma.aiUsageCounter.update({ where: { userId_period: { userId, period } }, data: { aiGenerations: { decrement: 1 } } });
      return NextResponse.json({ error: `تجاوزت حد التوليد الشهري لخطة ${plan.name}` }, { status: 429 });
    }
    reserved = true;

    const result = await generateProduct({
      productType: input.productType as ProductType,
      qualityTier: input.qualityTier as QualityTier,
      language: input.language,
      topic: input.topic,
      extraInstructions: input.extraInstructions,
      targetAudience: input.targetAudience,
    });
    if (!result.content || result.content.length > 250000) throw new Error("Generated content is invalid or exceeds the content limit");

    const log = await prisma.aiGenerationLog.create({
      data: { userId, prompt: input.topic, productType: input.productType, qualityTier: input.qualityTier, language: input.language, result: result.content.slice(0, 5000), status: "SUCCESS" },
    });
    let product = null;
    if (input.publish) {
      let slug = (result.slug || `gen-${Date.now()}`).slice(0, 80);
      if (await prisma.product.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;
      product = await prisma.product.create({
        data: {
          slug,
          title: result.title.slice(0, 200),
          description: result.description.slice(0, 1000),
          content: result.content,
          contentType: result.contentType,
          productType: input.productType,
          qualityTier: input.qualityTier,
          priceXrp: result.estimatedValueXrp,
          priceUsd: Math.round(result.estimatedValueXrp * Number(process.env.XRP_USD_RATE || "0.6") * 100) / 100,
          category: (result.category || input.productType).slice(0, 100),
          tags: result.tags.slice(0, 8).join(",").slice(0, 500),
          language: input.language,
          isActive: true,
          isAiGenerated: true,
          creatorId: userId,
        },
      });
      await prisma.aiGenerationLog.update({ where: { id: log.id }, data: { productId: product.id } });
    }

    const sameType = await prisma.product.count({ where: { productType: input.productType, isActive: true } });
    const quote = computeDynamicPrice({ productType: input.productType, qualityTier: input.qualityTier, basePriceXrp: result.estimatedValueXrp, viewCount: 0, downloadCount: 0, catalogCountSameType: sameType, ageHours: 0 });
    return NextResponse.json({ result: { ...result, estimatedValueXrp: quote.priceXrp }, pricing: quote, product, logId: log.id, remainingGenerations: Math.max(0, plan.maxAiGenerations - usage.aiGenerations), usedOpenAI: Boolean(process.env.OPENAI_API_KEY) });
  } catch (error: unknown) {
    if (reserved) await prisma.aiUsageCounter.update({ where: { userId_period: { userId, period } }, data: { aiGenerations: { decrement: 1 } } }).catch(() => undefined);
    const message = error instanceof Error ? error.message : "فشل التوليد";
    console.error("Generate API error", message);
    return NextResponse.json({ error: "فشل التوليد" }, { status: 500 });
  }
}
