/**
 * Sanity tests for the timezone math.
 * Run: `npm run test:tz`
 */
import { DateTime } from "luxon";

/* Re-implement the conversion using luxon so the test runs in node without DOM. */
function zonedTimeToUtc(
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
  return dt.toUTC().toJSDate();
}

function fmtInZone(date: Date, tz: string): string {
  return DateTime.fromJSDate(date, { zone: "utc" })
    .setZone(tz)
    .toLocaleString({
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
}

const cases: { label: string; date: string; time: string; from: string; expectHour: number }[] = [
  { label: "Texas 10:00 → Spain (June, summer)", date: "2026-06-09", time: "10:00", from: "America/Chicago", expectHour: 17 },
  { label: "Texas 10:00 → Spain (January, winter)", date: "2026-01-12", time: "10:00", from: "America/Chicago", expectHour: 17 },
  { label: "NY 09:00 → Spain (June)", date: "2026-06-09", time: "09:00", from: "America/New_York", expectHour: 15 },
  { label: "Tokyo 21:00 → Spain (June)", date: "2026-06-09", time: "21:00", from: "Asia/Tokyo", expectHour: 14 },
  { label: "LA 06:00 → Spain (June)", date: "2026-06-09", time: "06:00", from: "America/Los_Angeles", expectHour: 15 },
  { label: "London 09:00 → Spain (June)", date: "2026-06-09", time: "09:00", from: "Europe/London", expectHour: 10 },
  { label: "Madrid 10:00 → Madrid 10:00", date: "2026-06-09", time: "10:00", from: "Europe/Madrid", expectHour: 10 },
  // DST transitions
  { label: "Texas across spring-forward (Mar 8, 2026)", date: "2026-03-07", time: "23:30", from: "America/Chicago", expectHour: 6 },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const utc = zonedTimeToUtc(c.date, c.time, c.from);
  const spainStr = fmtInZone(utc, "Europe/Madrid");
  const m = spainStr.match(/(\d{1,2}):(\d{2})/);
  const spainHour = m ? Number(m[1]) : null;
  const ok = spainHour === c.expectHour;
  const icon = ok ? "✅" : "❌";
  console.log(
    `${icon} ${c.label} → ${spainStr} (UTC ${utc.toISOString()}) expected ${c.expectHour}:00`
  );
  if (ok) pass++;
  else fail++;
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
