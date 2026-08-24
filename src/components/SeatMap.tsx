"use client";

type SeatCell = {
  seatId: string;
  label: string;
  row: number;
  col: number;
  status: "AVAILABLE" | "HELD" | "BOOKED";
  category: { name: string; color: string };
  heldByMe?: boolean;
};

export function SeatMap({
  rows,
  cols,
  seats,
  selected,
  onToggle,
}: {
  rows: number;
  cols: number;
  seats: SeatCell[];
  selected: string[];
  onToggle: (seatId: string, status: string) => void;
}) {
  const grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) =>
      seats.find((s) => s.row === r + 1 && s.col === c + 1)
    )
  );

  function seatStyle(seat: SeatCell, isSelected: boolean) {
    if (isSelected) return { background: "#ff4f70", color: "#ffffff", borderColor: "#ff7991", boxShadow: "0 8px 18px rgba(255,79,112,.28)" };
    if (seat.status === "BOOKED") return { background: "#121018", color: "rgba(255,255,255,0.2)", borderColor: "rgba(255,255,255,.04)" };
    if (seat.status === "HELD") return { background: "#292535", color: "#ffffff", borderColor: "rgba(255,255,255,.22)" };
    return { background: "#211e2a", color: "#d8d4e0", borderColor: "rgba(255,255,255,.1)" };
  }

  return (
    <div className="card space-y-5 p-5 md:p-7">
      <div className="seat-stage"><span>SCREEN</span></div>
      <div className="overflow-x-auto pb-2 text-center">
        <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {grid.flat().map((seat, i) => {
            if (!seat) return <div key={i} className="h-9 w-9 md:h-10 md:w-10" />;
            const isSelected = selected.includes(seat.seatId);
            const disabled = seat.status === "BOOKED" || (seat.status === "HELD" && !seat.heldByMe);
            const style = seatStyle(seat, isSelected);

            return (
              <button
                key={seat.seatId}
                title={`${seat.label} · ${seat.category.name}`}
                disabled={disabled}
                onClick={() => onToggle(seat.seatId, seat.status)}
                className="h-9 w-9 rounded-[9px] border text-[9px] font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed md:h-10 md:w-10"
                style={{
                  ...style,
                  opacity: disabled && !isSelected ? 0.5 : 1,
                }}
              >
                {seat.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-5 border-t border-white/[0.07] pt-5 text-[11px] muted">
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-[#211e2a] ring-1 ring-white/10" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-[#292535] ring-1 ring-white/20" /> Held</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-[#121018]" /> Booked</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-[#ff4f70]" /> Selected</span>
      </div>
    </div>
  );
}
