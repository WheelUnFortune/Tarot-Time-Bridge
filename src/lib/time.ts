/**
 * Time helpers — luxon-based.
 *
 * All timezone math goes through luxon. We never use raw Date arithmetic
 * for zone-relative wall clocks; we always anchor to an IANA zone string.
 */
import { DateTime, IANAZone } from "luxon";

export type TimeRange = { from: string; to: string };
export type DayHours = TimeRange[];
export type WeeklyHours = Record<0 | 1 | 2 | 3 | 4 | 5 | 6, DayHours>;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type BookingType = "inperson" | "remote";

export interface Booking {
  id: string;
  name: string;
  tz: string;
  type: BookingType;
  date: string; // YYYY-MM-DD in myTz
  time: string; // HH:MM in myTz
  createdAt: string;
}

/** Default weekly hours — Spanish siesta-friendly: late morning + evening. */
export const DEFAULT_HOURS: WeeklyHours = {
  0: [],
  1: [
    { from: "10:00", to: "13:30" },
    { from: "17:00", to: "20:30" },
  ],
  2: [
    { from: "10:00", to: "13:30" },
    { from: "17:00", to: "20:30" },
  ],
  3: [
    { from: "10:00", to: "13:30" },
    { from: "17:00", to: "20:30" },
  ],
  4: [
    { from: "10:00", to: "13:30" },
    { from: "17:00", to: "20:30" },
  ],
  5: [
    { from: "10:00", to: "13:30" },
    { from: "17:00", to: "20:30" },
  ],
  6: [{ from: "11:00", to: "14:00" }],
};

export const DEFAULT_EXTRA_TZS = ["America/Chicago", "America/New_York"] as const;

/** All IANA timezones the runtime knows about. */
export function listTimezones(): string[] {
  if (typeof Intl.supportedValuesOf === "function") {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      // fall through
    }
  }
  return [
    "Europe/Madrid",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Lisbon",
    "Europe/Athens",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "America/Mexico_City",
    "America/Sao_Paulo",
    "America/Argentina/Buenos_Aires",
    "Africa/Lagos",
    "Africa/Cairo",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Australia/Sydney",
    "Pacific/Auckland",
    "UTC",
  ];
}

export function isValidZone(zone: string | null | undefined): zone is string {
  if (!zone) return false;
  try {
    return IANAZone.isValidZone(zone);
  } catch {
    return false;
  }
}

/** Curated list of zones for the time-zone picker. */
export const CURATED_ZONES: string[] = [
  "Europe/Madrid",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Lisbon",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Bogota",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Africa/Lagos",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Australia/Perth",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "UTC",
];

/** Override labels — IANA covers multiple well-known cities. */
export const ZONE_LABELS: Record<string, string> = {
  "America/Chicago": "Chicago / Dallas",
  "America/New_York": "New York / Atlanta",
};

/**
 * Common city-name aliases that resolve to canonical IANA zones.
 * Lets the freeText picker treat "madrid" the same as "Europe/Madrid".
 * Keys are lowercased and trimmed before lookup.
 */
export const ZONE_ALIASES: Record<string, string> = {
  // Europe
  "madrid": "Europe/Madrid",
  "london": "Europe/London",
  "paris": "Europe/Paris",
  "berlin": "Europe/Berlin",
  "lisbon": "Europe/Lisbon",
  "athens": "Europe/Athens",
  "istanbul": "Europe/Istanbul",
  "moscow": "Europe/Moscow",
  "rome": "Europe/Rome",
  "amsterdam": "Europe/Amsterdam",
  "barcelona": "Europe/Madrid",
  "valencia": "Europe/Madrid",
  "sevilla": "Europe/Madrid",
  // Americas
  "new york": "America/New_York",
  "nyc": "America/New_York",
  "manhattan": "America/New_York",
  "brooklyn": "America/New_York",
  "chicago": "America/Chicago",
  "dallas": "America/Chicago",
  "atlanta": "America/New_York",
  "denver": "America/Denver",
  "los angeles": "America/Los_Angeles",
  "la": "America/Los_Angeles",
  "san francisco": "America/Los_Angeles",
  "sf": "America/Los_Angeles",
  "seattle": "America/Los_Angeles",
  "toronto": "America/Toronto",
  "vancouver": "America/Vancouver",
  "mexico city": "America/Mexico_City",
  "bogota": "America/Bogota",
  "sao paulo": "America/Sao_Paulo",
  "buenos aires": "America/Argentina/Buenos_Aires",
  // Africa & Middle East
  "lagos": "Africa/Lagos",
  "cairo": "Africa/Cairo",
  "johannesburg": "Africa/Johannesburg",
  "dubai": "Asia/Dubai",
  // Asia
  "kolkata": "Asia/Kolkata",
  "mumbai": "Asia/Kolkata",
  "delhi": "Asia/Kolkata",
  "bangkok": "Asia/Bangkok",
  "singapore": "Asia/Singapore",
  "hong kong": "Asia/Hong_Kong",
  "tokyo": "Asia/Tokyo",
  "seoul": "Asia/Seoul",
  "beijing": "Asia/Shanghai",
  "shanghai": "Asia/Shanghai",
  // Oceania
  "sydney": "Australia/Sydney",
  "perth": "Australia/Perth",
  "melbourne": "Australia/Sydney",
  "auckland": "Pacific/Auckland",
  "honolulu": "Pacific/Honolulu",
};

/** If `input` is a known city alias, return the canonical IANA zone. */
export function resolveZoneAlias(input: string | null | undefined): string | null {
  if (!input) return null;
  return ZONE_ALIASES[input.trim().toLowerCase()] ?? null;
}

/** Pretty-print a city name from an IANA zone: "America/Chicago" → "Chicago" */
export function zoneToLabel(zone: string): string {
  if (!zone) return "";
  if (ZONE_LABELS[zone]) return ZONE_LABELS[zone];
  const parts = zone.split("/");
  let label = parts[parts.length - 1].replace(/_/g, " ");
  if (parts.length > 1 && parts[0] === "America" && parts[1] === "Argentina") {
    label = parts.slice(1).join(" · ").replace(/_/g, " ");
  }
  return label;
}

/** Guess a Spain-ish timezone for first-run users. */
export function guessSpanishTz(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && /^Europe\/Madrid$/.test(tz)) return "Europe/Madrid";
  } catch {
    // ignore
  }
  return "Europe/Madrid";
}

/**
 * Convert a local date+time in a given IANA timezone to a UTC Date.
 * The returned Date is anchored to a true moment in time.
 */
export function zonedTimeToUtc(
  dateStr: string, // "YYYY-MM-DD"
  timeStr: string, // "HH:MM" or "HH:MM:SS"
  tz: string
): Date {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = (timeStr || "00:00").split(":").map(Number);
  const dt = DateTime.fromObject(
    { year: y, month: mo, day: d, hour: h, minute: mi, second: 0 },
    { zone: tz }
  );
  if (!dt.isValid) {
    // Fallback: treat as UTC
    return new Date(Date.UTC(y, mo - 1, d, h, mi, 0));
  }
  return dt.toUTC().toJSDate();
}

/** Convert UTC Date to a DateTime in a specific zone. */
export function inZone(date: Date, tz: string): DateTime {
  return DateTime.fromJSDate(date, { zone: "utc" }).setZone(tz);
}

/** Formatted date+time in zone, 12-hour AM/PM by default. */
export function fmtInZone(
  date: Date,
  tz: string
): string {
  const dt = inZone(date, tz);
  if (!dt.isValid) return "—";
  return dt.toLocaleString({
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function fmtDateInZone(date: Date, tz: string): string {
  const dt = inZone(date, tz);
  if (!dt.isValid) return "—";
  return dt.toLocaleString({
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function fmtTimeInZone(date: Date, tz: string): string {
  const dt = inZone(date, tz);
  if (!dt.isValid) return "—";
  return dt.toLocaleString({
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function fmtHourMinInZone(date: Date, tz: string): string {
  return fmtTimeInZone(date, tz);
}

/** YYYY-MM-DD in given zone. */
export function dateStringInZone(date: Date, tz: string): string {
  const dt = inZone(date, tz);
  if (!dt.isValid) return "";
  return dt.toFormat("yyyy-LL-dd");
}

/** Short timezone abbreviation, e.g. "CEST". */
export function tzAbbrev(tz: string, date: Date = new Date()): string {
  try {
    const dt = DateTime.fromJSDate(date, { zone: tz });
    return dt.offsetNameShort || "";
  } catch {
    return "";
  }
}

/** Short offset, e.g. "UTC+2". */
export function tzOffsetLabel(tz: string, date: Date = new Date()): string {
  try {
    const dt = DateTime.fromJSDate(date, { zone: tz });
    const offMin = dt.offset; // minutes
    const sign = offMin >= 0 ? "+" : "-";
    const abs = Math.abs(offMin);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    if (m === 0) return `UTC${sign}${h}`;
    return `UTC${sign}${h}:${String(m).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

/** Is the given UTC moment inside any of the day's open ranges (in myTz)? */
export function isWithinMyHours(
  utcDate: Date,
  myTz: string,
  hours: WeeklyHours
): { in: boolean; dow: DayOfWeek } {
  const dt = DateTime.fromJSDate(utcDate, { zone: "utc" }).setZone(myTz);
  if (!dt.isValid) return { in: false, dow: 0 };
  // Luxon weekday: 1=Mon … 7=Sun
  const luxDow = dt.weekday;
  const dow = luxDow === 7 ? 0 : (luxDow as DayOfWeek);
  const cur = dt.hour * 60 + dt.minute;
  const ranges = hours[dow] || [];
  for (const r of ranges) {
    const [fh, fm] = r.from.split(":").map(Number);
    const [th, tm] = r.to.split(":").map(Number);
    if (cur >= fh * 60 + fm && cur < th * 60 + tm) {
      return { in: true, dow };
    }
  }
  return { in: false, dow };
}

/** Get the weekday (0=Sun) for a UTC instant when viewed in a given zone. */
export function dayOfWeekInZone(date: Date, tz: string): DayOfWeek {
  const dt = DateTime.fromJSDate(date, { zone: "utc" }).setZone(tz);
  if (!dt.isValid) return 0;
  const luxDow = dt.weekday;
  return luxDow === 7 ? 0 : (luxDow as DayOfWeek);
}

/** Sunday of the week containing the given date (host-local midnight). */
export function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay(); // 0=Sun
  x.setDate(x.getDate() - dow);
  return x;
}

/** Format minutes-since-midnight as "HH:MM". */
export function minToHm(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Parse "HH:MM" to minutes-since-midnight. */
export function hmToMin(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

/** Suggest the next 90-min free slot for a day. */
export function suggestNextSlot(dow: DayOfWeek, hours: WeeklyHours): TimeRange {
  const taken = (hours[dow] || [])
    .map((r) => ({ s: hmToMin(r.from), e: hmToMin(r.to) }))
    .sort((a, b) => a.s - b.s);
  for (let m = 9 * 60; m + 90 <= 21 * 60; m += 30) {
    const e = m + 90;
    const overlap = taken.some((t) => m < t.e && e > t.s);
    if (!overlap) return { from: minToHm(m), to: minToHm(e) };
  }
  return { from: "10:00", to: "13:00" };
}

/** Find the local-midnight UTC instant for a given date in a zone. */
export function localMidnightUtc(date: Date, tz: string): Date {
  const dt = DateTime.fromJSDate(date, { zone: tz }).startOf("day");
  return dt.toUTC().toJSDate();
}

/** Find the next day's local-midnight UTC instant. */
export function nextLocalMidnightUtc(date: Date, tz: string): Date {
  const dt = DateTime.fromJSDate(date, { zone: tz }).startOf("day").plus({ days: 1 });
  return dt.toUTC().toJSDate();
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function listZonesSafe(): string[] {
  return listTimezones();
}
