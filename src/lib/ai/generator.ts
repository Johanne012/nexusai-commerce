/**
 * NexusAI Commerce — AI Product Generation Engine
 * Max commerce value: 8 types × 4 tiers × multi-language
 * Uses OpenAI when OPENAI_API_KEY is set; otherwise rich structured templates.
 */

import { priceForNewProduct } from "@/lib/pricing/dynamic";

export type ProductType =
  | "ebook"
  | "marketing_copy"
  | "code_snippet"
  | "product_desc"
  | "report"
  | "service_package"
  | "prompt_pack"
  | "api_template";

export type QualityTier = "basic" | "standard" | "premium" | "enterprise";

export interface GenerationRequest {
  productType: ProductType;
  qualityTier: QualityTier;
  language: "ar" | "en" | "fr" | "es";
  topic: string;
  extraInstructions?: string;
  targetAudience?: string;
}

export interface GenerationResult {
  title: string;
  description: string;
  content: string;
  contentType: "markdown" | "html" | "code" | "json";
  tags: string[];
  estimatedValueXrp: number;
  slug?: string;
  category?: string;
  commerceAngle?: string;
}



function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60)
    .replace(/^-|-$/g, "") || `product-${Date.now()}`;
}

function priceFor(type: ProductType, tier: QualityTier, topicLen: number): number {
  return priceForNewProduct(type, tier, topicLen);
}

/** Strong commerce system prompt for real LLM */
function buildCommerceSystemPrompt(lang: string): string {
  const isAr = lang === "ar";
  return isAr
    ? `أنت خبير منتجات رقمية وتجارة إلكترونية. مهمتك توليد منتج رقمي جاهز للبيع الفوري.
القواعد:
- ركّز على القيمة التجارية: حل مشكلة، توفير وقت، زيادة مبيعات، أو معرفة قابلة للتطبيق.
- المحتوى يجب أن يكون عملياً وقابلاً للاستخدام فوراً (خطوات، قوائم، أمثلة).
- العنوان جذاب وواضح للسوق العربي.
- الوصف قصير يبيع المنتج في سطرين.
- أضف وسوماً تجارية مفيدة للبحث.
- لا تذكر أنك ذكاء اصطناعي داخل المحتوى.
أرجع JSON فقط بهذا الشكل:
{"title":"...","description":"...","content":"...markdown...","tags":["..."],"category":"...","commerceAngle":"لماذا يشتري العميل هذا"}`
    : `You are an expert digital product creator for e-commerce. Generate a ready-to-sell digital product.
Rules:
- Maximize commercial value: solve a problem, save time, increase sales, or deliver actionable knowledge.
- Content must be practical and immediately usable (steps, lists, examples).
- Title is clear and market-oriented.
- Description sells in two lines.
- Include searchable commercial tags.
- Do not mention being an AI inside the content.
Return JSON only:
{"title":"...","description":"...","content":"...markdown...","tags":["..."],"category":"...","commerceAngle":"why the buyer pays"}`;
}

function buildUserPrompt(req: GenerationRequest): string {
  const { productType, qualityTier, language, topic, extraInstructions, targetAudience } = req;
  const depth =
    qualityTier === "basic"
      ? "short, essential"
      : qualityTier === "standard"
        ? "solid, practical"
        : qualityTier === "premium"
          ? "detailed, professional, examples"
          : "comprehensive, enterprise-grade, frameworks + checklists";

  return [
    `Product type: ${productType}`,
    `Quality: ${qualityTier} (${depth})`,
    `Language: ${language}`,
    `Topic: ${topic}`,
    targetAudience ? `Target audience: ${targetAudience}` : "",
    extraInstructions ? `Extra: ${extraInstructions}` : "",
    `Focus on commerce: pricing psychology, conversion, and practical deliverables a buyer can use the same day.`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function callOpenAI(req: GenerationRequest): Promise<GenerationResult | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildCommerceSystemPrompt(req.language) },
          { role: "user", content: buildUserPrompt(req) },
        ],
      }),
    });

    if (!res.ok) {
      console.error("OpenAI error", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(raw) as {
      title?: string;
      description?: string;
      content?: string;
      tags?: string[];
      category?: string;
      commerceAngle?: string;
    };

    const title = parsed.title || (req.language === "ar" ? `منتج: ${req.topic}` : `Product: ${req.topic}`);
    return {
      title,
      description: parsed.description || title,
      content: parsed.content || "",
      contentType: req.productType === "code_snippet" || req.productType === "api_template" ? "code" : "markdown",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [req.topic, req.productType],
      estimatedValueXrp: priceFor(req.productType, req.qualityTier, req.topic.length),
      slug: slugify(title),
      category: parsed.category || req.productType,
      commerceAngle: parsed.commerceAngle,
    };
  } catch (e) {
    console.error("OpenAI generate failed", e);
    return null;
  }
}

/** Enhanced template generators — commerce-focused, richer than placeholders */
function genEbook(topic: string, tier: QualityTier, ar: boolean, audience?: string): GenerationResult {
  const title = ar ? `دليل عملي: ${topic}` : `Practical Guide: ${topic}`;
  const who = audience || (ar ? "رواد الأعمال والتجار" : "founders and sellers");
  const content = ar
    ? `# ${title}

## لمن هذا الدليل؟
${who} الذين يريدون نتائج قابلة للقياس خلال أسابيع.

## لماذا هذا الموضوع مهم تجارياً؟
${topic} يؤثر مباشرة على المبيعات، التكلفة، أو سرعة التشغيل. هذا الدليل يحوّل الفكرة إلى خطوات تنفيذ.

## الفصل 1 — الأساس
- تعريف واضح لـ **${topic}** في سياق التجارة
- أخطاء شائعة تكلّف المال
- مؤشرات نجاح (KPIs) بسيطة

## الفصل 2 — التنفيذ خطوة بخطوة
1. تقييم الوضع الحالي
2. اختيار الأدوات المناسبة
3. تجربة صغيرة (Pilot)
4. قياس النتيجة وتوسيع ما ينجح

## الفصل 3 — قوالب جاهزة
- قائمة تحقق أسبوعية
- جدول أولويات
- أسئلة لفريقك أو لمورّديك

## خطة 30 يوماً
| الأسبوع | الهدف | النتيجة المتوقعة |
|---------|--------|------------------|
| 1 | فهم وتشخيص | خريطة واضحة |
| 2 | تجربة | أول نتيجة قابلة للقياس |
| 3 | تحسين | رفع الكفاءة |
| 4 | توسيع | نظام قابل للتكرار |

## الخلاصة
ابدأ اليوم بخطوة واحدة قابلة للقياس. ${topic} ليس نظرية — هو رافعة ربح إذا طُبّق بانضباط.

*مستوى الجودة: ${tier}*`
    : `# ${title}

## Who is this for?
${who} who need measurable results within weeks.

## Why it matters commercially
**${topic}** impacts revenue, cost, or speed. This guide turns concepts into execution.

## Chapter 1 — Foundations
- Clear definition of **${topic}** in a commerce context
- Costly mistakes to avoid
- Simple KPIs

## Chapter 2 — Step-by-step
1. Assess current state
2. Choose tools
3. Run a pilot
4. Measure and scale what works

## Chapter 3 — Ready templates
- Weekly checklist
- Priority matrix
- Team questions

## 30-day plan
Week 1 diagnose → Week 2 pilot → Week 3 improve → Week 4 scale.

*Quality: ${tier}*`;

  return {
    title,
    description: ar
      ? `دليل تطبيقي عن ${topic} يركز على النتائج التجارية والخطوات القابلة للتنفيذ.`
      : `Actionable guide on ${topic} focused on commercial outcomes and steps you can run this week.`,
    content,
    contentType: "markdown",
    tags: [topic, "ebook", "commerce", tier, ar ? "عربي" : "english"],
    estimatedValueXrp: priceFor("ebook", tier, topic.length),
    slug: slugify(title),
    category: "education",
    commerceAngle: ar ? "معرفة قابلة للبيع والتطبيق فوراً" : "Knowledge buyers can apply the same day",
  };
}

function genMarketing(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `حزمة تسويق: ${topic}` : `Marketing Pack: ${topic}`;
  const content = ar
    ? `# ${title}

## زاوية البيع الرئيسية
${topic} — حل واضح لمشكلة يشعر بها العميل يومياً.

## عناوين إعلانية (A/B)
1. توقف عن خسارة المبيعات بسبب ${topic}
2. كيف يحقق التجار نتائج أفضل مع ${topic} في 14 يوماً
3. الدليل المختصر الذي يختصر شهور من التجربة

## نص إعلان قصير (سوشيال)
هل ما زلت تعتمد على العشوائية في ${topic}؟
هذه الحزمة تعطيك نصوصاً جاهزة + هيكل حملة + دعوات إجراء مجرّبة.
اشترِ مرة — استخدم عشرات المرات.

## بريد إلكتروني ترحيبي
الموضوع: خطوتك الأولى نحو ${topic} بفعالية
الجسم: مرحباً، هذا ما ستحصل عليه فوراً بعد الشراء... (3 نقاط قيمة) + رابط الوصول.

## دعوات إجراء (CTA)
- ابدأ الآن
- احصل على الحزمة
- جرّب النسخة العملية

*الجودة: ${tier}*`
    : `# ${title}

## Core angle
${topic} — a clear fix for a daily pain.

## Ad headlines
1. Stop losing sales because of ${topic}
2. Better results with ${topic} in 14 days
3. The short playbook that saves months of trial

## Social copy
Still guessing with ${topic}?
This pack gives ready copy + campaign structure + proven CTAs.

## Welcome email
Subject: Your first step to effective ${topic}
Body: What you get immediately after purchase...

*Quality: ${tier}*`;

  return {
    title,
    description: ar
      ? `نصوص إعلانية وعناوين وCTAs جاهزة حول ${topic} لرفع التحويل.`
      : `Ready ad copy, headlines and CTAs around ${topic} to lift conversion.`,
    content,
    contentType: "markdown",
    tags: [topic, "marketing", "copy", "conversion", tier],
    estimatedValueXrp: priceFor("marketing_copy", tier, topic.length),
    slug: slugify(title),
    category: "marketing",
    commerceAngle: ar ? "محتوى يبيع مباشرة" : "Copy that sells immediately",
  };
}

function genCode(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `مقطع برمجي: ${topic}` : `Code Snippet: ${topic}`;
  const content = `/**
 * ${topic}
 * Production-oriented snippet for commerce apps
 */

export type CommerceConfig = {
  apiKey?: string;
  mode: "live" | "test";
};

export async function run${topic.replace(/\W/g, "").slice(0, 24) || "Task"}(cfg: CommerceConfig) {
  if (cfg.mode === "test") {
    return { ok: true, mode: "test", message: "Dry run for ${topic}" };
  }

  return { ok: true, mode: "live", topic: "${topic}" };
}

// Example usage in a checkout or webhook handler
export function example() {
  return run${topic.replace(/\W/g, "").slice(0, 24) || "Task"}({ mode: "test" });
}
`;
  return {
    title,
    description: ar
      ? `كود جاهز للدمج في تطبيقات التجارة حول ${topic}.`
      : `Ready-to-integrate commerce code around ${topic}.`,
    content,
    contentType: "code",
    tags: [topic, "code", "typescript", "commerce", tier],
    estimatedValueXrp: priceFor("code_snippet", tier, topic.length),
    slug: slugify(title),
    category: "development",
  };
}

function genProductDesc(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `وصف منتج: ${topic}` : `Product Description: ${topic}`;
  const content = ar
    ? `## ${topic}

**الوصف القصير:** حل عملي لـ ${topic} يناسب المتاجر والفرق الصغيرة.

**الفوائد:**
- توفير وقت الإعداد
- وضوح للعميل النهائي
- جاهز للنشر على صفحة المنتج

**لمن؟** أصحاب متاجر، مسوّقين، ومنشئي محتوى رقمي.

**ماذا يشمل؟** نص رئيسي + نقاط قوة + دعوة إجراء.`
    : `## ${topic}

**Short:** Practical solution for ${topic} for stores and small teams.

**Benefits:** Faster setup, clearer buyer message, ready for product page.

**Includes:** Main copy + bullets + CTA.`;
  return {
    title,
    description: ar ? `وصف منتج احترافي جاهز للنشر` : `Professional product description ready to publish`,
    content,
    contentType: "markdown",
    tags: [topic, "description", "seo", tier],
    estimatedValueXrp: priceFor("product_desc", tier, topic.length),
    slug: slugify(title),
    category: "copywriting",
  };
}

function genReport(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `تقرير سوق: ${topic}` : `Market Report: ${topic}`;
  const content = ar
    ? `# ${title}

## الملخص التنفيذي
${topic} يشهد طلباً متزايداً في التجارة الرقمية. هذا التقرير يلخّص الفرص والمخاطر وخطوات الدخول.

## حجم الفرصة
- شريحة العملاء المستهدفة
- حساسية السعر
- قنوات الاكتساب الأقل تكلفة

## المنافسون والتموضع
- ماذا يفعل اللاعبون الحاليون؟
- أين الفجوة التي يمكن ملؤها بمنتج رقمي؟

## توصيات عملية
1. ابدأ بعرض ضيق عالي القيمة
2. اختبر السعر على شريحة صغيرة
3. اجمع شهادات ثم وسّع

## مؤشرات للمتابعة
معدل التحويل، قيمة الطلب، تكلفة الاكتساب، معدل الإرجاع.

*الجودة: ${tier}*`
    : `# ${title}

## Executive summary
${topic} is a growing demand area in digital commerce. Opportunities, risks, and entry steps.

## Opportunity size
Audience, price sensitivity, lowest-cost acquisition channels.

## Competition & positioning
What incumbents do and where a digital product can win.

## Actions
Narrow high-value offer → test price → collect proof → expand.

*Quality: ${tier}*`;
  return {
    title,
    description: ar ? `تقرير تحليلي يركز على فرص الربح في ${topic}` : `Analytical report focused on profit opportunities in ${topic}`,
    content,
    contentType: "markdown",
    tags: [topic, "report", "market", "strategy", tier],
    estimatedValueXrp: priceFor("report", tier, topic.length),
    slug: slugify(title),
    category: "research",
  };
}

function genService(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `باقة خدمات: ${topic}` : `Service Package: ${topic}`;
  const content = ar
    ? `## ${title}

### العرض
باقة محددة المخرجات حول **${topic}** — بدون غموض في النطاق.

### يشمل
- جلسة تشخيص
- خطة تنفيذ مكتوبة
- تسليم المخرجات المتفق عليها
- مراجعة واحدة بعد التسليم

### لا يشمل
- أعمال خارج النطاق
- اشتراكات طرف ثالث

### التسعير المقترح
يُحسب حسب التعقيد؛ هذا المستند يبيع الباقة ويوضح الحدود.`
    : `## ${title}

### Offer
Fixed-scope package around **${topic}**.

### Includes
Diagnosis session, written plan, agreed deliverables, one revision.

### Excludes
Out-of-scope work, third-party subscriptions.`;
  return {
    title,
    description: ar ? `باقة خدمات واضحة النطاق حول ${topic}` : `Clear-scope service package for ${topic}`,
    content,
    contentType: "markdown",
    tags: [topic, "service", "package", tier],
    estimatedValueXrp: priceFor("service_package", tier, topic.length),
    slug: slugify(title),
    category: "services",
  };
}

function genPrompts(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `حزمة برومبتات: ${topic}` : `Prompt Pack: ${topic}`;
  const content = ar
    ? `## ${title}

### 1) برومبت الاستراتيجية
أنت مستشار تجارة إلكترونية. حلّل "${topic}" وقدّم: شريحة العملاء، عرض القيمة، وقنوات البيع الأنسب.

### 2) برومبت المحتوى
اكتب وصف منتج + 5 عناوين إعلانية + بريد ترحيبي عن ${topic} بالعربية، نبرة احترافية ومباشرة.

### 3) برومبت التحسين
بناءً على معدل تحويل منخفض لصفحة ${topic}، اقترح 7 تحسينات مرتبة حسب الأثر/الجهد.

### 4) برومبت التسعير
اقترح 3 شرائح سعر لـ ${topic} مع تبرير نفسي وتجاري لكل شريحة.`
    : `## ${title}

### 1) Strategy prompt
Act as an e-commerce advisor. Analyze "${topic}": audience, value prop, best channels.

### 2) Content prompt
Write product description + 5 ad headlines + welcome email for ${topic}.

### 3) Optimization prompt
Given low conversion on a ${topic} page, list 7 improvements by impact/effort.

### 4) Pricing prompt
Propose 3 price tiers for ${topic} with commercial rationale.`;
  return {
    title,
    description: ar ? `برومبتات جاهزة لبناء وبيع عروض حول ${topic}` : `Ready prompts to build and sell offers around ${topic}`,
    content,
    contentType: "markdown",
    tags: [topic, "prompts", "ai", "commerce", tier],
    estimatedValueXrp: priceFor("prompt_pack", tier, topic.length),
    slug: slugify(title),
    category: "ai-tools",
  };
}

function genApi(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `قالب API: ${topic}` : `API Template: ${topic}`;
  const content = `// API Template — ${topic}
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  return NextResponse.json({
    ok: true,
    topic: "${topic}",
    id,
    message: "Wire this to your commerce backend",
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  // validate → persist → respond
  return NextResponse.json({ ok: true, received: body }, { status: 201 });
}
`;
  return {
    title,
    description: ar ? `قالب API جاهز للدمج في أنظمة التجارة` : `API template ready for commerce systems`,
    content,
    contentType: "code",
    tags: [topic, "api", "nextjs", "commerce", tier],
    estimatedValueXrp: priceFor("api_template", tier, topic.length),
    slug: slugify(title),
    category: "development",
  };
}

export async function generateProduct(req: GenerationRequest): Promise<GenerationResult> {
  // 1) Prefer real AI when key is present
  const fromLlm = await callOpenAI(req);
  if (fromLlm) return fromLlm;

  // 2) Fallback: rich commerce templates
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
  const ar = req.language === "ar";
  const { productType, qualityTier, topic, targetAudience, extraInstructions } = req;

  const generators: Record<ProductType, () => GenerationResult> = {
    ebook: () => genEbook(topic, qualityTier, ar, targetAudience),
    marketing_copy: () => genMarketing(topic, qualityTier, ar),
    code_snippet: () => genCode(topic, qualityTier, ar),
    product_desc: () => genProductDesc(topic, qualityTier, ar),
    report: () => genReport(topic, qualityTier, ar),
    service_package: () => genService(topic, qualityTier, ar),
    prompt_pack: () => genPrompts(topic, qualityTier, ar),
    api_template: () => genApi(topic, qualityTier, ar),
  };

  const result = generators[productType]();
  if (extraInstructions) {
    result.content += `\n\n---\n**تعليمات إضافية:** ${extraInstructions}`;
  }
  return result;
}

export const PRODUCT_TYPES: { id: ProductType; labelAr: string; labelEn: string }[] = [
  { id: "ebook", labelAr: "كتاب إلكتروني", labelEn: "Ebook" },
  { id: "marketing_copy", labelAr: "نصوص تسويقية", labelEn: "Marketing Copy" },
  { id: "code_snippet", labelAr: "مقاطع برمجية", labelEn: "Code Snippet" },
  { id: "product_desc", labelAr: "وصف منتجات", labelEn: "Product Description" },
  { id: "report", labelAr: "تقارير سوق", labelEn: "Market Report" },
  { id: "service_package", labelAr: "باقات خدمات", labelEn: "Service Package" },
  { id: "prompt_pack", labelAr: "حزم برومبتات", labelEn: "Prompt Pack" },
  { id: "api_template", labelAr: "قوالب API", labelEn: "API Template" },
];

export const QUALITY_TIERS: { id: QualityTier; labelAr: string; labelEn: string }[] = [
  { id: "basic", labelAr: "أساسي", labelEn: "Basic" },
  { id: "standard", labelAr: "قياسي", labelEn: "Standard" },
  { id: "premium", labelAr: "مميز", labelEn: "Premium" },
  { id: "enterprise", labelAr: "مؤسسي", labelEn: "Enterprise" },
];
