"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("البريد أو كلمة المرور غير صحيحة");
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
          <h1 className="text-2xl font-bold">تسجيل الدخول</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
            مرحبًا بعودتك إلى NexusAI
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
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
            {loading ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
          ليس لديك حساب؟{" "}
          <Link
            href="/register"
            className="text-[hsl(var(--primary))] hover:underline"
          >
            سجل الآن
          </Link>
        </p>
      </div>
    </div>
  );
}
