import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))] text-sm text-[hsl(var(--primary-foreground))]">N</span>
              NexusAI Commerce
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              منصة آلية لإنتاج وبيع المنتجات والخدمات الرقمية بالذكاء الاصطناعي، مع دعم مدفوعات XRP ونظام Escrow.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">المنصة</h4>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <li><Link href="/products" className="hover:text-[hsl(var(--foreground))]">المنتجات</Link></li>
              <li><Link href="/generate" className="hover:text-[hsl(var(--foreground))]">توليد بالذكاء</Link></li>
              <li><Link href="/marketplace" className="hover:text-[hsl(var(--foreground))]">سوق الوساطة</Link></li>
              <li><Link href="/subscriptions" className="hover:text-[hsl(var(--foreground))]">الاشتراكات</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">الدعم</h4>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <li><Link href="/dashboard" className="hover:text-[hsl(var(--foreground))]">لوحة التحكم</Link></li>
              <li><a href="https://github.com/Johanne012/nexusai-commerce" target="_blank" rel="noreferrer" className="hover:text-[hsl(var(--foreground))]">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">التقنيات</h4>
            <ul className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
              <li>Next.js 14 + Tailwind</li>
              <li>XRPL + XRPSCAN</li>
              <li>Prisma</li>
              <li>AI Generation Engine</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-[hsl(var(--border))] pt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          © {new Date().getFullYear()} NexusAI Commerce
        </div>
      </div>
    </footer>
  );
}
