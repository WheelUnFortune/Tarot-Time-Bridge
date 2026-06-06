import { useEffect, useState } from "react";
import { QuickConvert } from "@/components/QuickConvert";
import { WeeklyHours as WeeklyHoursEditor } from "@/components/WeeklyHours";
import { WeekGrid } from "@/components/WeekGrid";
import { Bookings } from "@/components/Bookings";
import { useLocalStorage } from "@/lib/storage";
import {
  DEFAULT_EXTRA_TZS,
  DEFAULT_HOURS,
  fmtInZone,
  guessSpanishTz,
  tzAbbrev,
  type Booking,
  type WeeklyHours,
} from "@/lib/time";

const STORAGE = {
  myTz: "ttb.myTz",
  hours: "ttb.hours",
  extraTzs: "ttb.extraTzs",
  bookings: "ttb.bookings",
} as const;

export default function App() {
  const [myTz, setMyTz] = useLocalStorage<string>(STORAGE.myTz, guessSpanishTz());
  const [hours, setHours] = useLocalStorage<WeeklyHours>(STORAGE.hours, DEFAULT_HOURS);
  const [extraTzs, setExtraTzs] = useLocalStorage<string[]>(STORAGE.extraTzs, [...DEFAULT_EXTRA_TZS]);
  const [bookings, setBookings] = useLocalStorage<Booking[]>(STORAGE.bookings, []);
  const [now, setNow] = useState<Date>(new Date());

  // Tick "now" every 30s for the topbar clock
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30 * 1000);
    return () => window.clearInterval(id);
  }, []);

  const addTz = (z: string) => {
    if (!extraTzs.includes(z)) setExtraTzs([...extraTzs, z]);
  };
  const removeTz = (z: string) => {
    setExtraTzs(extraTzs.filter((x) => x !== z));
  };

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 border-b border-line backdrop-blur-md" style={{ background: "linear-gradient(180deg, rgba(28,23,64,0.6), rgba(28,23,64,0.15))" }}>
        <div className="container flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl drop-shadow-[0_0_8px_rgba(232,200,112,0.4)]">🕯️</span>
            <div>
              <h1 className="text-lg leading-none">Tarot Time Bridge</h1>
              <p className="text-sm italic text-ink-2 m-0">Your hours, in any timezone.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 justify-end">
            <label className="flex flex-col gap-1 text-[0.7rem] uppercase tracking-wider text-ink-2">
              My timezone
              <select
                value={myTz}
                onChange={(e) => setMyTz(e.target.value)}
                className="h-9 rounded-md border border-line bg-bg-1 px-2 text-sm text-ink-0 focus:outline-none focus:border-violet"
              >
                <TzOptions value={myTz} />
              </select>
            </label>
            <div
              className="rounded-md border border-line px-3 py-2 font-mono text-sm text-gold-soft whitespace-nowrap"
              style={{ background: "rgba(0,0,0,0.25)" }}
            >
              {fmtInZone(now, myTz)} · {tzAbbrev(myTz, now)}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6 flex-1">
        <QuickConvert myTz={myTz} hours={hours} />
        <WeeklyHoursEditor hours={hours} onChange={setHours} />
        <WeekGrid
          myTz={myTz}
          hours={hours}
          extraTzs={extraTzs}
          bookings={bookings}
          onAddTz={addTz}
          onRemoveTz={removeTz}
        />
        <Bookings myTz={myTz} bookings={bookings} onChange={setBookings} />
      </main>

      <footer className="text-center text-ink-3 text-sm py-8">
        🕯️ Built for tarot readings across timezones ·{" "}
        <a
          href="https://github.com/"
          className="text-gold-soft underline-offset-4 hover:underline border-b border-dotted border-gold-soft/40"
        >
          source on GitHub
        </a>
      </footer>
    </div>
  );
}

/**
 * Render a deduplicated list of IANA zones for the topbar `<select>`,
 * ensuring the current value is included even if it's not in the curated list.
 */
function TzOptions({ value }: { value: string }) {
  const [zones, setZones] = useState<string[]>([]);
  useEffect(() => {
    const all = new Set<string>();
    try {
      const supported = (Intl as { supportedValuesOf?: (k: string) => string[] })
        .supportedValuesOf?.("timeZone");
      if (supported) {
        for (const z of supported) all.add(z);
      }
    } catch {
      // ignore
    }
    all.add("UTC");
    if (value) all.add(value);
    setZones(Array.from(all).sort());
  }, [value]);
  return (
    <>
      {zones.map((z) => (
        <option key={z} value={z}>
          {z}
        </option>
      ))}
    </>
  );
}
