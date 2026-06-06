import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { TimezonePicker } from "@/components/TimezonePicker";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  DAY_SHORT,
  dayOfWeekInZone,
  fmtTimeInZone,
  isValidZone,
  localMidnightUtc,
  nextLocalMidnightUtc,
  startOfWeek,
  tzAbbrev,
  tzOffsetLabel,
  zoneToLabel,
  type Booking,
  type DayOfWeek,
  type WeeklyHours,
  zonedTimeToUtc,
} from "@/lib/time";

interface WeekGridProps {
  myTz: string;
  hours: WeeklyHours;
  extraTzs: string[];
  bookings: Booking[];
  onAddTz: (tz: string) => void;
  onRemoveTz: (tz: string) => void;
}

export function WeekGrid({ myTz, hours, extraTzs, bookings, onAddTz, onRemoveTz }: WeekGridProps) {
  const [anchor, setAnchor] = useState<Date>(startOfWeek(new Date()));
  const [newTz, setNewTz] = useState("");

  // Snap to current week once per day
  useEffect(() => {
    const tick = () => setAnchor(startOfWeek(new Date()));
    tick();
    const id = window.setInterval(tick, 60 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const prev = () => setAnchor(new Date(anchor.getTime() - 7 * 86400000));
  const next = () => setAnchor(new Date(anchor.getTime() + 7 * 86400000));
  const thisWeek = () => setAnchor(startOfWeek(new Date()));

  const end = new Date(anchor.getTime() + 6 * 86400000);
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(d);
  const weekLabel = `${fmt(anchor)} – ${fmt(end)}, ${end.getFullYear()}`;

  const handleAdd = () => {
    const z = newTz.trim();
    if (!z) return;
    if (!isValidZone(z)) return;
    onAddTz(z);
    setNewTz("");
  };

  const zones = [myTz, ...extraTzs];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>This week, side-by-side</CardTitle>
            <CardDescription>{weekLabel}</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={prev} aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={thisWeek}>
              This week
            </Button>
            <Button variant="ghost" size="icon" onClick={next} aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="min-w-[280px] flex-1">
            <Label htmlFor="extra-tz">Add another timezone</Label>
            <TimezonePicker
              id="extra-tz"
              value={newTz}
              onChange={(z) => {
                setNewTz(z);
              }}
              freeText
              placeholder="e.g. America/Chicago"
            />
          </div>
          <Button onClick={handleAdd} disabled={!isValidZone(newTz)}>
            Add
          </Button>
          <div className="flex flex-wrap gap-1.5">
            {extraTzs.map((z) => (
              <span
                key={z}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-mono"
                style={{
                  background: "rgba(164,140,242,0.12)",
                  border: "1px solid rgba(164,140,242,0.3)",
                  color: "hsl(var(--ink-0))",
                }}
              >
                {z}
                <button
                  type="button"
                  onClick={() => onRemoveTz(z)}
                  className="text-ink-2 hover:text-[hsl(var(--danger))] -mr-1"
                  aria-label={`Remove ${z}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div
          className="grid rounded-xl overflow-hidden border border-line bg-bg-1"
          style={{
            gridTemplateColumns: "minmax(120px,1.2fr) repeat(7, minmax(0, 1fr))",
            fontSize: "0.78rem",
          }}
        >
          {/* Header row */}
          <div className="border-b border-r border-line bg-bg-2 px-3 py-2 font-serif text-ink-0 text-sm flex items-center">
            Zone
          </div>
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(anchor.getTime() + i * 86400000);
            return (
              <div
                key={i}
                className="border-b border-line last:border-r-0 bg-bg-2 text-center py-2"
                style={{ borderRightWidth: i === 6 ? 0 : 1, borderRightColor: "hsl(var(--line))" }}
              >
                <div className="text-[0.65rem] uppercase tracking-widest text-ink-2">
                  {DAY_SHORT[d.getDay()]}
                </div>
                <div className="text-base text-ink-0 font-serif">{d.getDate()}</div>
              </div>
            );
          })}

          {/* Body rows */}
          {zones.map((zone) => (
            <ZoneRow
              key={zone}
              zone={zone}
              anchor={anchor}
              myTz={myTz}
              hours={hours}
              bookings={bookings}
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink-2">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "rgba(110,231,168,0.35)" }} />
            🟢 Open
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "rgba(246,194,112,0.4)" }} />
            🟡 Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "hsl(var(--bg-1))", border: "1px solid hsl(var(--line))" }} />
            ⬜ Off
          </span>
          <span className="text-ink-3">The grid uses your local timezone as the source of truth.</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ZoneRow({
  zone,
  anchor,
  myTz,
  hours,
  bookings,
}: {
  zone: string;
  anchor: Date;
  myTz: string;
  hours: WeeklyHours;
  bookings: Booking[];
}) {
  return (
    <>
      <div
        className="border-b border-r border-line bg-bg-2 px-3 py-2 font-mono"
        style={{ fontSize: "0.78rem" }}
      >
        <div className="text-ink-0 leading-tight">
          {zoneToLabel(zone)}
        </div>
        <div className="text-ink-3 text-[0.7rem]">
          {tzAbbrev(zone)} · {tzOffsetLabel(zone)}
        </div>
      </div>
      {Array.from({ length: 7 }, (_, i) => {
        const cellDate = new Date(anchor.getTime() + i * 86400000);
        const info = describeDayInZone(cellDate, zone, myTz, hours, bookings);
        return <Cell key={i} info={info} />;
      })}
    </>
  );
}

function Cell({ info }: { info: CellInfo }) {
  const bg =
    info.state === "booked"
      ? "rgba(246,194,112,0.25)"
      : info.state === "open"
        ? "rgba(110,231,168,0.18)"
        : "transparent";
  const color =
    info.state === "booked"
      ? "hsl(var(--amber))"
      : info.state === "open"
        ? "hsl(var(--green))"
        : "hsl(var(--ink-3))";
  return (
    <div
      className="border-b border-line last:border-r-0 px-2 py-1.5 min-h-[64px]"
      style={{
        borderRightWidth: 1,
        borderRightColor: "hsl(var(--line))",
        background: bg,
        color,
      }}
      title={info.title}
    >
      {info.html}
    </div>
  );
}

interface CellInfo {
  state: "open" | "booked" | "off";
  html: React.ReactNode;
  title: string;
}

/** What does my day D look like when viewed from a given target zone? */
function describeDayInZone(
  date: Date,
  zone: string,
  myTz: string,
  hours: WeeklyHours,
  bookings: Booking[]
): CellInfo {
  const myMidnightUtc = localMidnightUtc(date, myTz);
  const myNextMidnightUtc = nextLocalMidnightUtc(date, myTz);

  const dow: DayOfWeek = dayOfWeekInZone(myMidnightUtc, zone);
  const ranges = hours[dow] || [];
  const open = ranges.length > 0;

  const inRange = bookings
    .map((b) => ({ ...b, utc: zonedTimeToUtc(b.date, b.time, myTz) }))
    .filter((b) => b.utc >= myMidnightUtc && b.utc < myNextMidnightUtc);

  const titleParts = [
    `${zoneToLabel(zone)}`,
    `Your day ${new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date)} → ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dow]} in this zone`,
  ];
  if (open) {
    titleParts.push(`Hours: ${ranges.map((r) => `${r.from}–${r.to}`).join(", ")} (your time)`);
  } else {
    titleParts.push("Closed (your time)");
  }

  let html: React.ReactNode = null;
  let state: CellInfo["state"] = open ? "open" : "off";

  if (open && inRange.length === 0) {
    html = (
      <div className="flex flex-col gap-0.5">
        {ranges.map((r, i) => (
          <span key={i} className="font-sans text-[0.7rem]">
            {r.from}–{r.to}
          </span>
        ))}
      </div>
    );
  }

  if (inRange.length > 0) {
    state = "booked";
    html = (
      <div className="flex flex-col gap-0.5">
        {inRange.map((b, i) => {
          const t = fmtTimeInZone(b.utc, zone);
          const theirCity = zoneToLabel(b.tz);
          const showWhere = b.tz !== zone;
          return (
            <span key={i} className="font-sans text-[0.7rem] font-semibold leading-tight" style={{ color: "hsl(var(--amber))" }}>
              {t} · {b.name}
              {showWhere && <span className="opacity-75"> ({theirCity})</span>}
            </span>
          );
        })}
      </div>
    );
    titleParts.push(
      `Bookings: ${inRange
        .map((b) => `${b.name} @ ${fmtTimeInZone(b.utc, zone)} (${zone})`)
        .join("; ")}`
    );
  }

  return { state, html, title: titleParts.join("\n") };
}
