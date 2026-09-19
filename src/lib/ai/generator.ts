/**
 * AI Product Generation Engine
 * 8 product types x 4 quality tiers - Arabic + English
 */

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
}

const QUALITY_MULTIPLIER: Record<QualityTier, number> = {
  basic: 1,
  standard: 1.8,
  premium: 3.2,
  enterprise: 5.5,
};

export async function generateProduct(req: GenerationRequest): Promise<GenerationResult> {
  const { productType, qualityTier, language, topic, extraInstructions, targetAudience } = req;
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
  const isArabic = language === "ar";

  const generators: Record<ProductType, () => GenerationResult> = {
    ebook: () => genEbook(topic, qualityTier, isArabic, targetAudience),
    marketing_copy: () => genMarketing(topic, qualityTier, isArabic),
    code_snippet: () => genCode(topic, qualityTier, isArabic),
    product_desc: () => genProductDesc(topic, qualityTier, isArabic),
    report: () => genReport(topic, qualityTier, isArabic),
    service_package: () => genService(topic, qualityTier, isArabic),
    prompt_pack: () => genPrompts(topic, qualityTier, isArabic),
    api_template: () => genApi(topic, qualityTier, isArabic),
  };

  const result = generators[productType]();
  result.estimatedValueXrp =
    Math.round(result.estimatedValueXrp * QUALITY_MULTIPLIER[qualityTier] * 100) / 100;

  if (extraInstructions) {
    result.content += `\n\n---\n**Extra:** ${extraInstructions}`;
  }
  return result;
}

function genEbook(topic: string, tier: QualityTier, ar: boolean, audience?: string): GenerationResult {
  const title = ar ? `دليل شامل: ${topic}` : `Complete Guide: ${topic}`;
  const content = ar
    ? `# ${title}\n\n## المقدمة\nهذا الدليل يشرح **${topic}** بطريقة عملية.\n\n## الفصل 1\n- مفهوم ${topic}\n- أمثلة واقعية\n\n## الخلاصة\nخطة عمل سريعة.\n\n*الجودة: ${tier}*`
    : `# ${title}\n\n## Introduction\nA practical guide to **${topic}**.\n\n## Chapter 1\nFundamentals and examples.\n\n## Conclusion\nAction plan.\n\n*Quality: ${tier}*`;
  return {
    title,
    description: ar ? `كتاب إلكتروني عن ${topic}` : `Ebook about ${topic}`,
    content,
    contentType: "markdown",
    tags: [topic, "ebook", tier],
    estimatedValueXrp: 10,
  };
}

function genMarketing(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `حملة تسويقية: ${topic}` : `Marketing Campaign: ${topic}`;
  const content = ar
    ? `# ${title}\n\n## عناوين\n1. اكتشف ${topic}\n2. الحل الأمثل\n\n## دعوة للعمل\nجرّب الآن`
    : `# ${title}\n\n## Headlines\n1. Discover ${topic}\n2. Smart solution\n\n## CTA\nTry now`;
  return {
    title,
    description: ar ? `نصوص تسويقية` : `Marketing copy`,
    content,
    contentType: "markdown",
    tags: [topic, "marketing", tier],
    estimatedValueXrp: 5,
  };
}

function genCode(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `مقطع برمجي: ${topic}` : `Code Snippet: ${topic}`;
  const content = `// ${title}\nexport async function run() {\n  return { topic: "${topic}", tier: "${tier}" };\n}\n`;
  return {
    title,
    description: ar ? `كود جاهز` : `Ready code`,
    content,
    contentType: "code",
    tags: [topic, "code", tier],
    estimatedValueXrp: 7,
  };
}

function genProductDesc(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `وصف منتج: ${topic}` : `Product Description: ${topic}`;
  const content = ar
    ? `## ${title}\n\nحل عملي لـ ${topic}.\n\n**المميزات:** جودة عالية، سهل الاستخدام.`
    : `## ${title}\n\nPractical solution for ${topic}.\n\n**Features:** High quality, easy to use.`;
  return {
    title,
    description: ar ? `وصف منتج` : `Product description`,
    content,
    contentType: "markdown",
    tags: [topic, "description", tier],
    estimatedValueXrp: 4,
  };
}

function genReport(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `تقرير: ${topic}` : `Report: ${topic}`;
  const content = ar
    ? `# ${title}\n\n## الملخص\nنظرة على ${topic}.\n\n## التوصيات\nخطوات عملية.`
    : `# ${title}\n\n## Summary\nOverview of ${topic}.\n\n## Recommendations\nAction steps.`;
  return {
    title,
    description: ar ? `تقرير تحليلي` : `Analytical report`,
    content,
    contentType: "markdown",
    tags: [topic, "report", tier],
    estimatedValueXrp: 12,
  };
}

function genService(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `باقة خدمات: ${topic}` : `Service Package: ${topic}`;
  const content = ar
    ? `## ${title}\n\n### يشمل\n- بند 1\n- بند 2\n- بند 3`
    : `## ${title}\n\n### Included\n- Item 1\n- Item 2\n- Item 3`;
  return {
    title,
    description: ar ? `باقة خدمات` : `Service package`,
    content,
    contentType: "markdown",
    tags: [topic, "service", tier],
    estimatedValueXrp: 15,
  };
}

function genPrompts(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `حزمة برومبتات: ${topic}` : `Prompt Pack: ${topic}`;
  const content = ar
    ? `## ${title}\n\n1. برومبت أساسي\n2. برومبت متقدم\n3. برومبت تحليل`
    : `## ${title}\n\n1. Basic prompt\n2. Advanced prompt\n3. Analysis prompt`;
  return {
    title,
    description: ar ? `برومبتات جاهزة` : `Ready prompts`,
    content,
    contentType: "markdown",
    tags: [topic, "prompts", tier],
    estimatedValueXrp: 6,
  };
}

function genApi(topic: string, tier: QualityTier, ar: boolean): GenerationResult {
  const title = ar ? `قالب API: ${topic}` : `API Template: ${topic}`;
  const content = `// API Template — ${topic}\nimport { NextResponse } from "next/server";\n\nexport async function GET() {\n  return NextResponse.json({ ok: true, topic: "${topic}" });\n}\n`;
  return {
    title,
    description: ar ? `قالب API` : `API template`,
    content,
    contentType: "code",
    tags: [topic, "api", tier],
    estimatedValueXrp: 9,
  };
}

export const PRODUCT_TYPES: { id: ProductType; labelAr: string; labelEn: string }[] = [
  { id: "ebook", labelAr: "كتاب إلكتروني", labelEn: "Ebook" },
  { id: "marketing_copy", labelAr: "نصوص تسويقية", labelEn: "Marketing Copy" },
  { id: "code_snippet", labelAr: "مقاطع برمجية", labelEn: "Code Snippet" },
  { id: "product_desc", labelAr: "وصف منتجات", labelEn: "Product Description" },
  { id: "report", labelAr: "تقارير", labelEn: "Report" },
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
