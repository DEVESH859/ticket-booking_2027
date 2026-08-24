"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, clearToken, getToken, User } from "@/lib/client";

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function Nav() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    api<{ user: User }>("/api/auth/me").then((d) => setUser(d.user)).catch(() => clearToken());
  }, []);

  return (
    <header className="site-header">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-5 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="LUMIO home">
            <span className="brand-mark" />
            <span className="text-[17px] font-extrabold tracking-[0.17em] text-white">LUMIO</span>
          </Link>
          <nav className="desktop-nav flex items-center gap-1">
            <Link href="/?type=MOVIE#events" className="nav-link">Movies</Link>
            <Link href="/?type=CONCERT#events" className="nav-link">Live events</Link>
            <Link href="/#events" className="nav-link">Experiences</Link>
          </nav>
        </div>

        <nav className="flex shrink-0 items-center gap-1">
          <button className="desktop-nav nav-link flex items-center gap-1.5" type="button" title="Location"><PinIcon /> Mumbai</button>
          {user && <Link href="/bookings" className="nav-link">Tickets</Link>}
          {user?.role === "ADMIN" && <Link href="/admin/venues" className="nav-link">Venues</Link>}
          {user?.role === "ORGANISER" && <Link href="/organiser/events" className="nav-link">Studio</Link>}
          {user ? (
            <button
              onClick={() => { clearToken(); setUser(null); window.location.href = "/"; }}
              className="btn ml-1 !min-h-9 !rounded-[10px] !px-3 !py-1.5"
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-[#ff4f70] text-[10px] font-bold">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="hidden sm:inline">{user.name}</span>
            </button>
          ) : (
            <>
              <Link href="/login" className="nav-link hidden sm:block">Sign in</Link>
              <Link href="/register" className="btn btn-primary ml-1 !min-h-9 !rounded-[10px] !px-3.5 !py-1.5">Join free</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
