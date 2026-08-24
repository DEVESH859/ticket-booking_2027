"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";

type Event = {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  description?: string | null;
  venue: { name: string };
  organiser: { name: string };
  prices?: { price: number }[];
  _count?: { bookings: number };
};

function Icon({ name }: { name: "movie" | "music" | "star" | "ticket" | "search" | "arrow" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
  if (name === "movie") return <svg {...common}><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18M7 5l2 4M13 5l2 4" /></svg>;
  if (name === "music") return <svg {...common}><path d="M9 18V5l11-2v13M9 9l11-2" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>;
  if (name === "star") return <svg {...common}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></svg>;
  return <svg {...common}><path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3v3Z" /><path d="M13 6v12" /></svg>;
}

function friendlyDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", month: "short", day: "numeric" }).format(date);
}

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setType(new URLSearchParams(window.location.search).get("type") ?? "");
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (q) params.set("q", q);
    setLoading(true);
    api<{ events: Event[] }>(`/api/events?${params}`)
      .then((d) => setEvents(d.events))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type, q]);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    setQ(search.trim());
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
  }

  const categories = [
    { label: "All experiences", sub: "Everything, one place", icon: "star" as const, value: "" },
    { label: "Movies", sub: "Big screen stories", icon: "movie" as const, value: "MOVIE" },
    { label: "Live concerts", sub: "Feel every beat", icon: "music" as const, value: "CONCERT" },
    { label: "Weekend picks", sub: "Curated near you", icon: "ticket" as const, value: "" },
  ];

  return (
    <div className="space-y-16 pb-8">
      <section className="hero" aria-label="Discover live entertainment">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Mumbai is live tonight</span>
          <h1>Don&apos;t just watch it. <em>Live it.</em></h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/65 md:text-lg">
            Movies, concerts and unforgettable nights—beautifully curated and booked in seconds.
          </p>
          <form className="hero-search" onSubmit={submitSearch}>
            <span className="grid place-items-center pl-2 text-white/50"><Icon name="search" /></span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies, artists or venues" aria-label="Search events" />
            <button className="btn btn-primary" type="submit">Explore <Icon name="arrow" /></button>
          </form>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-white/50">
            <span>✓ Instant confirmation</span><span>✓ Live seat selection</span><span>✓ Secure QR tickets</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="browse-title" className="space-y-6">
        <div>
          <p className="label mb-2">Find your scene</p>
          <h2 id="browse-title" className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl">What are you in the mood for?</h2>
        </div>
        <div className="category-row">
          {categories.map((category) => (
            <button
              type="button"
              key={category.label}
              className={`category-pill text-left ${type === category.value && category.value !== "" ? "active" : ""}`}
              onClick={() => { setType(category.value); document.getElementById("events")?.scrollIntoView({ behavior: "smooth" }); }}
            >
              <span>
                <span className="block text-sm font-semibold">{category.label}</span>
                <span className="mt-1 block text-xs text-white/45">{category.sub}</span>
              </span>
              <span className="category-icon"><Icon name={category.icon} /></span>
            </button>
          ))}
        </div>
      </section>

      <section id="events" aria-labelledby="events-title" className="scroll-mt-24 space-y-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label mb-2">Curated for you</p>
            <h2 id="events-title" className="text-2xl font-semibold tracking-[-0.035em] md:text-3xl">
              {q ? `Results for “${q}”` : type === "MOVIE" ? "Movies worth the big screen" : type === "CONCERT" ? "Turn up the volume" : "Trending this week"}
            </h2>
          </div>
          {(type || q) && (
            <button className="btn btn-ghost !min-h-0 !px-2 !py-1" onClick={() => { setType(""); setQ(""); setSearch(""); }}>
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="event-grid">
            {[0, 1, 2, 3].map((i) => <div key={i} className="aspect-[0.72] animate-pulse rounded-[20px] bg-white/[0.05]" />)}
          </div>
        ) : events.length ? (
          <div className="event-grid">
            {events.map((event, index) => {
              const from = event.prices?.length ? Math.min(...event.prices.map((p) => p.price)) : null;
              return (
                <Link key={event.id} href={`/events/${event.id}`} className="event-card group">
                  <div className={`poster poster-${index % 6}`}>
                    <span className="poster-badge">{event.type === "MOVIE" ? "IN CINEMAS" : "LIVE"}</span>
                    <span className="poster-orbit" />
                    <div className="poster-copy">
                      <p className="poster-kicker">{event.venue.name}</p>
                      <p className="poster-title">{event.title}</p>
                    </div>
                  </div>
                  <div className="px-1 pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-semibold text-white">{event.title}</h3>
                        <p className="mt-1 truncate text-xs text-white/48">{friendlyDate(event.date)} · {event.time} · {event.venue.name}</p>
                      </div>
                      <span className="shrink-0 rounded-md bg-white/[0.06] px-2 py-1 text-[10px] font-bold text-white/70">{from ? `₹${from}+` : "View"}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card p-10 text-center">
            <p className="text-lg font-semibold">No shows found just yet</p>
            <p className="mt-2 text-sm muted">Try a different search or explore every experience.</p>
          </div>
        )}
      </section>

      <section className="perk-strip" aria-label="Booking benefits">
        <div className="perk"><span className="perk-num">01</span><div><p className="text-sm font-semibold">Pick your exact seat</p><p className="mt-1 text-xs muted">A live map, updated in real time.</p></div></div>
        <div className="perk"><span className="perk-num">02</span><div><p className="text-sm font-semibold">Book with confidence</p><p className="mt-1 text-xs muted">Timed holds mean no surprise losses.</p></div></div>
        <div className="perk"><span className="perk-num">03</span><div><p className="text-sm font-semibold">Walk in with your phone</p><p className="mt-1 text-xs muted">Your secure QR ticket arrives instantly.</p></div></div>
      </section>
    </div>
  );
}
