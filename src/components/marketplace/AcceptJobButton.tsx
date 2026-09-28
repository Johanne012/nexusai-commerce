"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function AcceptJobButton({ jobId, status }: { jobId: string; status: string }) {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (status !== "OPEN") {
    return (
      <span className="mt-3 inline-block text-xs text-[hsl(var(--muted-foreground))]">
        {status === "IN_PROGRESS" ? "قيد التنفيذ" : status}
      </span>
    );
  }

  async function accept() {
    if (authStatus !== "authenticated") {
      router.push("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/marketplace/jobs/${jobId}/accept`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل");
      setDone(true);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <span className="mt-3 text-sm text-[hsl(var(--success))]">تم القبول ✓</span>;
  }

  return (
    <div className="mt-3">
      {error && <p className="text-xs text-red-400 mb-1">{error}</p>}
      <button
        type="button"
        onClick={accept}
        disabled={loading}
        className="rounded-xl border border-[hsl(var(--border))] px-4 py-2 text-sm hover:bg-[hsl(var(--muted))] disabled:opacity-50"
      >
        {loading ? "..." : "قبول الوظيفة"}
      </button>
    </div>
  );
}
