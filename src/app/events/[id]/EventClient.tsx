"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { SeatMap } from "@/components/SeatMap";
import { api, getToken } from "@/lib/client";

type ShowSeat = {
  seatId: string;
  status: string;
  heldById?: string | null;
  seat: { label: string; row: number; col: number; categoryId: string; category: { name: string; color: string } };
};

type OfferInfo = {
  seatId: string | null;
  seatLabel: string | null;
  categoryName: string;
  expiresAt: string | null;
  requiresLogin?: boolean;
};

export default function EventClient() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const offerToken = searchParams.get("offer");
  const [event, setEvent] = useState<{
    title: string;
    type: string;
    description?: string | null;
    date: string;
    time: string;
    venue: { name: string };
    organiser: { name: string };
    prices: { categoryId: string; price: number; category: { name: string } }[];
  } | null>(null);
  const [showSeats, setShowSeats] = useState<ShowSeat[]>([]);
  const [layout, setLayout] = useState<{ rows: number; cols: number } | null>(null);
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<{ name: string; email: string } | null>(null);
  const [offer, setOffer] = useState<OfferInfo | null>(null);

  const loadSeats = useCallback(async () => {
    const data = await api<{
      showSeats: ShowSeat[];
      layout: { rows: number; cols: number };
      availability: Record<string, number>;
    }>(`/api/events/${id}/seats`);
    setShowSeats(data.showSeats);
    setLayout(data.layout);
    setAvailability(data.availability ?? {});
  }, [id]);

  useEffect(() => {
    api<{ event: typeof event }>(`/api/events/${id}`).then((d) => setEvent(d.event)).catch(console.error);
    if (getToken()) {
      api<{ user: { id: string; name: string; email: string } }>("/api/auth/me")
        .then((d) => {
          setUserId(d.user.id);
          setCustomer({ name: d.user.name, email: d.user.email });
        })
        .catch(() => null);
    }
    loadSeats();
    const timer = setInterval(loadSeats, 3000);
    return () => clearInterval(timer);
  }, [id, loadSeats]);

  useEffect(() => {
    if (!offerToken) return;
    api<{ offer: OfferInfo; requiresLogin?: boolean }>(
      `/api/events/${id}/waitlist/offer?token=${offerToken}`
    )
      .then((d) => {
        setOffer(d.offer);
        if (d.offer.seatId) setSelected([d.offer.seatId]);
        setMessage(
          d.requiresLogin
            ? `Waitlist offer for ${d.offer.seatLabel ?? "a seat"} — log in to complete booking.`
            : `Waitlist offer: ${d.offer.seatLabel} (${d.offer.categoryName}). Expires ${d.offer.expiresAt ? new Date(d.offer.expiresAt).toLocaleString() : "soon"}.`
        );
      })
      .catch((e) => setMessage(e.message));
  }, [id, offerToken]);

  function toggleSeat(seatId: string, status: string) {
    if (status === "BOOKED") return;
    if (offer?.seatId && seatId !== offer.seatId) return;
    setSelected((prev) => (prev.includes(seatId) ? prev.filter((s) => s !== seatId) : [...prev, seatId]));
  }

  async function holdSeats() {
    if (!getToken()) return router.push(`/login?next=/events/${id}?offer=${offerToken ?? ""}`);
    try {
      const res = await api<{ heldUntil: string }>(`/api/events/${id}/seats`, {
        method: "POST",
        body: JSON.stringify({ seatIds: selected, offerToken }),
      });
      setMessage(`Seats held until ${new Date(res.heldUntil).toLocaleTimeString()}`);
      await loadSeats();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Hold failed");
    }
  }

  async function bookSeats() {
    if (!getToken()) return router.push(`/login?next=/events/${id}?offer=${offerToken ?? ""}`);
    try {
      const res = await api<{ booking: { ref: string } }>(`/api/events/${id}/book`, {
        method: "POST",
        body: JSON.stringify({ seatIds: selected, offerToken }),
      });
      setMessage(`Booked! Ref ${res.booking.ref}. Check your email for the QR ticket.`);
      setSelected([]);
      setOffer(null);
      await loadSeats();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Booking failed");
    }
  }

  async function joinWaitlist(categoryId: string) {
    if (!getToken()) return router.push("/login");
    try {
      await api(`/api/events/${id}/waitlist`, { method: "POST", body: JSON.stringify({ categoryId }) });
      setMessage("Added to waitlist for this category.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Waitlist failed");
    }
  }

  if (!event || !layout) return <p className="muted text-sm">Loading...</p>;

  const seatCells = showSeats.map((s) => ({
    seatId: s.seatId,
    label: s.seat.label,
    row: s.seat.row,
    col: s.seat.col,
    status: s.status as "AVAILABLE" | "HELD" | "BOOKED",
    category: s.seat.category,
    heldByMe: s.heldById === userId,
  }));

  const selectedDetails = selected.map((seatId) => {
    const cell = seatCells.find((seat) => seat.seatId === seatId);
    const price = event.prices.find((item) => item.categoryId === cell?.category.name || item.category.name === cell?.category.name)?.price ?? 0;
    return { ...cell, price };
  });
  const total = selectedDetails.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <div className="space-y-8 pb-8">
      <div className="overflow-hidden rounded-[26px] border border-white/[0.09] bg-[radial-gradient(circle_at_75%_30%,rgba(255,79,112,.25),transparent_25%),radial-gradient(circle_at_50%_100%,rgba(136,108,255,.18),transparent_40%),#121018] px-6 py-9 md:px-10 md:py-12">
        <p className="label">{event.type === "MOVIE" ? "Now showing" : "Live experience"}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.055em] md:text-6xl">{event.title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 md:text-base">{event.description || "An unforgettable experience, live and in the moment."}</p>
        <div className="mt-7 flex flex-wrap gap-2 text-xs font-medium text-white/70">
          <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2">{event.date}</span>
          <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2">{event.time}</span>
          <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2">{event.venue.name}</span>
          <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2">by {event.organiser.name}</span>
        </div>
      </div>

      {offer && (
        <div className="message">
          Waitlist offer — seat {offer.seatLabel} ({offer.categoryName}).
          {offer.expiresAt && ` Complete before ${new Date(offer.expiresAt).toLocaleString()}.`}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4 px-1">
            <div><p className="label">Choose your view</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Select your seats</h2></div>
            <span className="text-xs muted">Updates live</span>
          </div>
          <SeatMap rows={layout.rows} cols={layout.cols} seats={seatCells} selected={selected} onToggle={toggleSeat} />
        </div>

        <aside className="card sticky top-24 overflow-hidden">
          <div className="border-b border-white/[0.08] p-5">
            <p className="label">Your order</p>
            <h2 className="mt-2 text-xl font-semibold">{selected.length ? `${selected.length} seat${selected.length > 1 ? "s" : ""} selected` : "Pick a seat to begin"}</h2>
          </div>
          <div className="space-y-4 p-5">
            {selected.length ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {selectedDetails.map((seat) => <span key={seat.seatId} className="rounded-lg bg-[#ff4f70]/10 px-2.5 py-1.5 text-xs font-semibold text-[#ff8ba1]">{seat.label}</span>)}
                </div>
                <button onClick={holdSeats} className="btn w-full">Hold seats for 10 min</button>
                <div className="space-y-2 border-y border-white/[0.08] py-4 text-sm">
                  <div className="flex justify-between"><span className="muted">Ticket total</span><span>₹{total}</span></div>
                  <div className="flex justify-between"><span className="muted">Booking fee</span><span className="text-[#4fd2a0]">Free</span></div>
                  <div className="flex justify-between pt-1 text-base font-semibold"><span>Payable</span><span>₹{total}</span></div>
                </div>
                {customer ? (
                  <div className="text-xs leading-5 muted">QR ticket will be sent to <span className="text-white/80">{customer.email}</span>.</div>
                ) : (
                  <p className="text-xs leading-5 muted">Sign in to secure your seats and receive the QR ticket.</p>
                )}
                <button onClick={bookSeats} disabled={!customer} className="btn btn-primary w-full">Confirm & book</button>
              </>
            ) : (
              <div className="py-5 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-2xl">↗</div>
                <p className="mt-4 text-sm leading-6 muted">Select one or more available seats from the live map.</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      <div className="card p-5 md:p-7">
        <div className="flex items-end justify-between gap-4"><div><p className="label">Options</p><h2 className="mt-2 text-xl font-semibold">Pricing & availability</h2></div><span className="text-xs muted">per ticket</span></div>
        <ul className="mt-5 divide-y divide-white/[0.07] text-sm">
          {event.prices.map((p) => {
            const seatsLeft = availability[p.categoryId] ?? 0;
            return (
              <li key={p.categoryId} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <span><span className="font-medium">{p.category.name}</span><span className="ml-2 text-xs muted">{seatsLeft > 0 ? `${seatsLeft} seats left` : "Sold out"}</span></span>
                <span className="flex items-center gap-4"><strong>₹{p.price}</strong>
                {seatsLeft === 0 && (
                  <button onClick={() => joinWaitlist(p.categoryId)} className="btn !min-h-9 !px-3 !py-1.5 text-xs">Join waitlist</button>
                )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {message && <p className="message">{message}</p>}
    </div>
  );
}
