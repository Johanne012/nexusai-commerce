import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-[hsl(var(--muted-foreground))] mb-6">الصفحة غير موجودة</p>
      <Link href="/" className="text-[hsl(var(--primary))] underline">
        العودة للرئيسية
      </Link>
    </div>
  );
}
