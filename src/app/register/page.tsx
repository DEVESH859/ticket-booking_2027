"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, setToken } from "@/lib/client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const data = await api<{ token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          role: form.get("role"),
        }),
      });
      setToken(data.token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-content">
          <span className="eyebrow"><span className="eyebrow-dot" /> Membership, reimagined</span>
          <h2 className="mt-5 max-w-sm text-3xl font-semibold tracking-[-0.05em]">More moments. Less waiting.</h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">Be first to discover new shows, secure live seats and get instant digital tickets.</p>
        </div>
      </div>
      <div className="auth-form">
        <p className="label">Join the experience</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Create your account</h1>
        <p className="mt-2 text-sm muted">Free to join. Ready for every screen and stage.</p>
        <form onSubmit={onSubmit} className="mt-7 space-y-3">
          <input name="name" required placeholder="Full name" className="input w-full" />
          <input name="email" type="email" required placeholder="Email address" className="input w-full" />
          <input name="password" type="password" required placeholder="Create a password" className="input w-full" />
          <select name="role" className="input w-full"><option value="CUSTOMER">I want to book experiences</option><option value="ORGANISER">I organise events</option></select>
          {error && <p className="message !py-2.5">{error}</p>}
          <button type="submit" className="btn btn-primary !mt-5 w-full">Create free account</button>
        </form>
        <p className="mt-6 text-center text-sm muted">Already a member? <Link href="/login" className="font-semibold text-[#ff6b87] hover:text-white">Sign in</Link></p>
      </div>
    </div>
  );
}
