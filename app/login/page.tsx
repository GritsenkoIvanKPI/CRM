"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const next = searchParams.get("next") ?? "/";
      router.push(next);
      router.refresh();
    } else {
      setLoading(false);
      setError("Невірний пароль");
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-bg px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(201,162,76,0.10), transparent 70%), radial-gradient(40% 40% at 85% 100%, rgba(99,161,127,0.06), transparent 70%)",
        }}
      />
      <div className="grain pointer-events-none absolute inset-0" />

      <div className="animate-rise shadow-floating relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface p-8 sm:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-accent-soft bg-accent-soft">
            <span className="font-display text-lg text-accent-strong">G</span>
          </div>
          <h1 className="font-display text-2xl tracking-tight text-text">
            G.Vision CRM
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Вхід для внутрішнього використання
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-xs font-medium uppercase tracking-wide text-text-faint"
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-danger-soft bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="shadow-accent-glow mt-2 inline-flex items-center justify-center rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-ink transition-transform duration-200 ease-out hover:bg-accent-strong active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
          >
            {loading ? "Вхід..." : "Увійти"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
