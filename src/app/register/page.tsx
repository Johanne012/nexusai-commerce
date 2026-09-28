"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "فشل التسجيل");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("تم إنشاء الحساب، لكن فشل الدخول التلقائي. سجّل الدخول يدوياً.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">إنشاء حساب</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            انضم إلى NexusAI وابدأ في الإنتاج والبيع
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">الاسم</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="اسمك"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              minLength={10}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[hsl(var(--primary))] py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "جاري التسجيل..." : "إنشاء الحساب"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          لديك حساب بالفعل؟{" "}
          <Link
            href="/login"
            className="text-[hsl(var(--primary))] hover:underline"
          >
            سجل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
