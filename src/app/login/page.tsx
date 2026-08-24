"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { api, setToken } from "@/lib/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const data = await api<{ token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      setToken(data.token);
      router.push(searchParams.get("next") || "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-content">
          <span className="eyebrow"><span className="eyebrow-dot" /> Your next story awaits</span>
          <h2 className="mt-5 max-w-sm text-3xl font-semibold tracking-[-0.05em]">Every great night starts with a ticket.</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">Save favourites, choose your seats and keep every QR ticket in one place.</p>
        </div>
      </div>
      <div className="auth-form">
        <p className="label">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Sign in to LUMIO</h1>
        <p className="mt-2 text-sm muted">Your next unforgettable experience is one step away.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-xs font-medium text-white/70">Email address<input name="email" type="email" required placeholder="you@example.com" className="input mt-2 w-full" /></label>
          <label className="block text-xs font-medium text-white/70">Password<input name="password" type="password" required placeholder="Enter your password" className="input mt-2 w-full" /></label>
          {error && <p className="message !py-2.5">{error}</p>}
          <button type="submit" className="btn btn-primary mt-2 w-full">Sign in</button>
        </form>
        <p className="mt-6 text-center text-sm muted">New to LUMIO? <Link href="/register" className="font-semibold text-[#ff6b87] hover:text-white">Create an account</Link></p>
        <div className="mt-7 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 text-[11px] leading-5 text-white/45">Demo: customer@demo.com · password123</div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="muted text-sm">Loading...</p>}>
      <LoginForm />
    </Suspense>
  );
}
