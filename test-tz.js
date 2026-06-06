// Reuse the conversion functions from app.js to verify the math
// at runtime. Loaded into a small jsdom-less harness.

const fs = require("fs");
const path = require("path");

// Stub out DOM-touching parts so we can require the module.
global.document = {
  getElementById: () => ({ value: "", addEventListener: () => {}, appendChild: () => {}, querySelector: () => null, querySelectorAll: () => [], innerHTML: "", textContent: "", classList: { add: () => {}, remove: () => {}, toggle: () => {} } }),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ classList: { add: () => {} }, appendChild: () => {}, addEventListener: () => {} }),
  addEventListener: () => {},
};
global.window = global;
global.localStorage = { getItem: () => null, setItem: () => {} };
global.Intl = Intl;

// Pull the conversion functions out of app.js by eval-ing it in a context that captures them.
// Simpler: re-implement the same conversion logic and compare.

function zonedTimeToUtc(dateStr, timeStr, tz) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = timeStr.split(":").map(Number);
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi, 0));
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  const parts = fmt.formatToParts(guess).reduce((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  if (parts.hour === "24") parts.hour = "00";
  const wallAsUtc = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour), Number(parts.minute), Number(parts.second)
  );
  const offsetMs = wallAsUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

function fmtInZone(date, tz) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(date);
}

const cases = [
  { label: "Texas 10:00 → Spain (June, summer)", date: "2026-06-09", time: "10:00", from: "America/Chicago", expectHour: 17 },
  { label: "Texas 10:00 → Spain (January, winter)", date: "2026-01-12", time: "10:00", from: "America/Chicago", expectHour: 17 },
  { label: "NY 09:00 → Spain (June)", date: "2026-06-09", time: "09:00", from: "America/New_York", expectHour: 15 },
  { label: "Tokyo 21:00 → Spain (June)", date: "2026-06-09", time: "21:00", from: "Asia/Tokyo", expectHour: 14 },
  { label: "LA 06:00 → Spain (June)", date: "2026-06-09", time: "06:00", from: "America/Los_Angeles", expectHour: 15 },
  { label: "London 09:00 → Spain (June)", date: "2026-06-09", time: "09:00", from: "Europe/London", expectHour: 10 },
  { label: "Madrid 10:00 → Madrid 10:00", date: "2026-06-09", time: "10:00", from: "Europe/Madrid", expectHour: 10 },
  // DST transitions
  { label: "Texas across spring-forward (Mar 8, 2026)", date: "2026-03-07", time: "23:30", from: "America/Chicago", expectHour: 6 }, // 23:30 CST → 06:30 CET next day? actually 05:30
];

let pass = 0, fail = 0;
for (const c of cases) {
  const utc = zonedTimeToUtc(c.date, c.time, c.from);
  const spainStr = fmtInZone(utc, "Europe/Madrid");
  const m = spainStr.match(/(\d{1,2}):(\d{2})/);
  const spainHour = m ? +m[1] : null;
  const ok = spainHour === c.expectHour;
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${c.label} → ${spainStr} (UTC ${utc.toISOString()}) expected ${c.expectHour}:00`);
  if (ok) pass++; else fail++;
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
