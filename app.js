/* ───────────────────────────────────────────────────────────
   Tarot Time Bridge — app logic
   No build step. Uses Intl.DateTimeFormat for all conversions
   (works in every modern browser, no API calls, fully offline).
   ─────────────────────────────────────────────────────────── */

(() => {
  "use strict";

  // ─────────── Storage keys ───────────
  const STORE = {
    myTz: "ttb.myTz",
    hours: "ttb.hours", // { 0: [{from,to}], 1: [...], ... } 0=Sun … 6=Sat
    extraTzs: "ttb.extraTzs", // ["America/Chicago", ...]
    bookings: "ttb.bookings", // [{id, name, tz, type, date, time, createdAt}]
  };

  // ─────────── Default working hours ───────────
  // Two ranges per day, Spainish siesta-friendly: late morning + evening
  const DEFAULT_HOURS = {
    0: [], // Sun
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
    6: [
      { from: "11:00", to: "14:00" },
    ],
  };

  const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // ─────────── Helpers ───────────

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  };
  const save = (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn("Could not save to localStorage", e);
    }
  };

  /** Returns a list of all IANA timezones the browser knows about. */
  function listTimezones() {
    if (typeof Intl.supportedValuesOf === "function") {
      try {
        return Intl.supportedValuesOf("timeZone");
      } catch {}
    }
    // Fallback: a curated list of common zones
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

  /**
   * Convert a local date+time in a given IANA timezone to a UTC Date.
   * Trick: build a date "as if" UTC, then ask Intl what wall-clock time
   * that is in the target zone, then take the diff.
   */
  function zonedTimeToUtc(dateStr, timeStr, tz) {
    // dateStr: "YYYY-MM-DD", timeStr: "HH:MM"
    const [y, mo, d] = dateStr.split("-").map(Number);
    const [h, mi] = timeStr.split(":").map(Number);

    // First approximation: treat the input as UTC
    const guess = new Date(Date.UTC(y, mo - 1, d, h, mi, 0));

    // What wall-clock time is `guess` in `tz`?
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(guess).reduce((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
    // Intl gives "24" for midnight in some browsers — normalize
    if (parts.hour === "24") parts.hour = "00";

    const wallAsUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );

    const offsetMs = wallAsUtc - guess.getTime();
    return new Date(guess.getTime() - offsetMs);
  }

  function fmtInZone(date, tz, opts = {}) {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      ...opts,
    }).format(date);
  }

  function fmtTimeInZone(date, tz) {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  function tzAbbrev(tz, date = new Date()) {
    try {
      const part = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "short",
      })
        .formatToParts(date)
        .find((p) => p.type === "timeZoneName");
      return part ? part.value : "";
    } catch {
      return "";
    }
  }

  function tzOffsetLabel(tz, date = new Date()) {
    // Returns "UTC+1" style label for the given zone at the given moment
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const part = fmt.formatToParts(date).find((p) => p.type === "timeZoneName");
    return part ? part.value.replace("GMT", "UTC") : "";
  }

  /** Pretty-print a city name from an IANA zone: "America/Chicago" → "Chicago" */
  function zoneToLabel(zone) {
    if (!zone) return "";
    const parts = zone.split("/");
    let label = parts[parts.length - 1].replace(/_/g, " ");
    if (parts.length > 1 && parts[0] === "America" && parts[1] === "Argentina") {
      label = parts.slice(1).join(" · ").replace(/_/g, " ");
    }
    return label;
  }

  function isValidZone(zone) {
    try {
      new Intl.DateTimeFormat(undefined, { timeZone: zone });
      return true;
    } catch {
      return false;
    }
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  // ─────────── State ───────────

  const state = {
    myTz: load(STORE.myTz, null) || guessSpainishTz(),
    hours: load(STORE.hours, null) || deepClone(DEFAULT_HOURS),
    extraTzs: load(STORE.extraTzs, ["America/Chicago", "America/New_York"]),
    bookings: load(STORE.bookings, []),
    tzList: listTimezones(),
  };

  function guessSpainishTz() {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz === "Europe/Madrid") return "Europe/Madrid";
    // Try to detect by offset: Spain is UTC+1 / UTC+2
    const offset = new Date().getTimezoneOffset();
    // -60 = UTC+1, -120 = UTC+2. In June, Spain is UTC+2.
    if (tz && /Europe\/Madrid/.test(tz)) return "Europe/Madrid";
    return "Europe/Madrid"; // sensible default for this app
  }

  function deepClone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  // ─────────── Topbar ───────────

  function populateTzSelects() {
    const sel = $("#my-tz");
    sel.innerHTML = state.tzList
      .map(
        (z) =>
          `<option value="${z}"${z === state.myTz ? " selected" : ""}>${z}</option>`
      )
      .join("");

    // Datalist for free-text input
    const dl = $("#tz-list");
    dl.innerHTML = state.tzList
      .map((z) => `<option value="${z}"></option>`)
      .join("");
  }

  function tickMyNow() {
    const el = $("#my-now");
    const now = new Date();
    el.textContent = `${fmtInZone(now, state.myTz)} · ${tzAbbrev(state.myTz, now)}`;
  }

  // ─────────── Quick convert ───────────

  function setupQuickConvert() {
    const tzIn = $("#client-tz-input");
    const dateIn = $("#client-date");
    const timeIn = $("#client-time");
    const resultTime = $("#result-time");
    const resultMeta = $("#result-meta");
    const swap = $("#swap-btn");
    const nowBtn = $("#now-btn");

    // Sensible defaults: today, next round hour
    const now = new Date();
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: state.myTz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now); // en-CA gives YYYY-MM-DD
    dateIn.value = today;
    timeIn.value = fmtTimeInZone(now, state.myTz).slice(0, 5);

    const update = () => {
      const tz = (tzIn.value || "").trim();
      if (!isValidZone(tz)) {
        resultTime.textContent = "—";
        resultMeta.textContent = tz
          ? `Unknown timezone: "${tz}". Try "Europe/Madrid" or "America/Chicago".`
          : "Pick a date and time to convert.";
        return;
      }
      if (!dateIn.value || !timeIn.value) return;

      const utc = zonedTimeToUtc(dateIn.value, timeIn.value, tz);

      resultTime.textContent = fmtInZone(utc, state.myTz);
      const myAbbr = tzAbbrev(state.myTz, utc);
      const theirAbbr = tzAbbrev(tz, utc);
      const myOff = tzOffsetLabel(state.myTz, utc);
      const theirOff = tzOffsetLabel(tz, utc);
      resultMeta.innerHTML = `
        ${tz} (${theirAbbr}, ${theirOff}) →
        ${state.myTz} (${myAbbr}, ${myOff})
        · <span class="muted">same moment, different clocks</span>
      `;

      // Flag if it's outside working hours
      const inMyHours = isWithinMyHours(utc);
      if (!inMyHours.in) {
        resultMeta.innerHTML +=
          ` · <span class="warn">⚠ outside your working hours</span>`;
      }
    };

    [tzIn, dateIn, timeIn].forEach((el) =>
      el.addEventListener("input", update)
    );

    swap.addEventListener("click", () => {
      // Swap means: take current result (in my tz) and show me what that is in the client's tz
      // — useful for "I'll do 4pm my time, what is that for them?"
      const tz = (tzIn.value || "").trim();
      if (!isValidZone(tz) || !dateIn.value || !timeIn.value) return;

      // What the input box currently represents (their tz) → that's now MY tz.
      // We need to push the date/time fields to my zone's wall clock equivalent
      // of the same UTC moment, then change the tz label.
      const utc = zonedTimeToUtc(dateIn.value, timeIn.value, tz);
      const myDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: state.myTz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(utc);
      const myTime = fmtTimeInZone(utc, state.myTz).slice(0, 5);
      dateIn.value = myDate;
      timeIn.value = myTime;
      tzIn.value = state.myTz;
      // Then change the dropdown meaning... actually easier: invert the labels.
      // We swapped: myTz becomes the input source, client's tz becomes target.
      // But the input semantics are "client's tz". So after swap, tzIn is now myTz
      // and we're showing what THAT is in client's tz.
      // The simplest model: swap the dropdown ↔ the "me" zone.
      // For now: keep the input box as "client's tz" and just update state.myTz.
      // To preserve the original tz, stash it.
      state.myTz = tz;
      save(STORE.myTz, state.myTz);
      populateTzSelects();
      update();
    });

    nowBtn.addEventListener("click", () => {
      const tz = (tzIn.value || "").trim();
      if (!isValidZone(tz)) return;
      const n = new Date();
      dateIn.value = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(n);
      timeIn.value = fmtTimeInZone(n, tz).slice(0, 5);
      update();
    });

    update();
  }

  // ─────────── Working-hours check ───────────

  function isWithinMyHours(utcDate) {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: state.myTz,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = fmt.formatToParts(utcDate).reduce((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
    if (parts.hour === "24") parts.hour = "00";
    const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dow = dowMap[parts.weekday];
    const hh = Number(parts.hour);
    const mm = Number(parts.minute);
    const cur = hh * 60 + mm;

    const ranges = state.hours[dow] || [];
    for (const r of ranges) {
      const [fh, fm] = r.from.split(":").map(Number);
      const [th, tm] = r.to.split(":").map(Number);
      if (cur >= fh * 60 + fm && cur < th * 60 + tm) {
        return { in: true, dow };
      }
    }
    return { in: false, dow };
  }

  // ─────────── Weekly hours editor ───────────

  function setupWeeklyHours() {
    renderHoursGrid();
    $("#add-hour-btn").addEventListener("click", () => {
      // Add a 10:00–13:00 range to the first day that has zero or to Monday
      const target = firstDayWithoutRanges();
      if (target == null) return;
      state.hours[target].push({ from: "10:00", to: "13:00" });
      save(STORE.hours, state.hours);
      renderHoursGrid();
    });
    $("#reset-hours-btn").addEventListener("click", () => {
      state.hours = deepClone(DEFAULT_HOURS);
      save(STORE.hours, state.hours);
      renderHoursGrid();
    });
  }

  function firstDayWithoutRanges() {
    for (let i = 0; i < 7; i++) {
      if (!state.hours[i] || state.hours[i].length === 0) return i;
    }
    return 1; // default to Monday
  }

  function renderHoursGrid() {
    const grid = $("#hours-grid");
    grid.innerHTML = "";
    for (let dow = 0; dow < 7; dow++) {
      const ranges = state.hours[dow] || [];
      const row = document.createElement("div");
      row.className = "hour-row" + (ranges.length === 0 ? " off" : "");
      row.innerHTML = `
        <div class="day-name">${DAY_NAMES[dow]}</div>
        <div class="ranges"></div>
        <label class="day-toggle">
          <input type="checkbox" data-dow="${dow}" data-action="day-toggle" ${
        ranges.length > 0 ? "checked" : ""
      }>
          <span>${ranges.length > 0 ? "Open" : "Off"}</span>
        </label>
        <button class="remove-range ghost" data-dow="${dow}" data-action="add" title="Add range">+</button>
      `;
      const rangesEl = row.querySelector(".ranges");
      if (ranges.length === 0) {
        rangesEl.innerHTML = `<span class="muted small" style="padding-left:.4rem">Closed</span>`;
      } else {
        ranges.forEach((r, idx) => {
          const wrap = document.createElement("div");
          wrap.className = "range";
          wrap.style.marginBottom = "0.25rem";
          wrap.innerHTML = `
            <input type="time" value="${r.from}" data-dow="${dow}" data-idx="${idx}" data-field="from">
            <span class="range-sep">→</span>
            <input type="time" value="${r.to}" data-dow="${dow}" data-idx="${idx}" data-field="to">
            <button class="remove-range" data-dow="${dow}" data-idx="${idx}" data-action="remove" title="Remove">×</button>
          `;
          rangesEl.appendChild(wrap);
        });
      }
      grid.appendChild(row);
    }

    // Wire events
    grid.querySelectorAll('input[type="time"]').forEach((inp) => {
      inp.addEventListener("change", (e) => {
        const dow = Number(e.target.dataset.dow);
        const idx = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        state.hours[dow][idx][field] = e.target.value;
        save(STORE.hours, state.hours);
      });
    });
    grid.querySelectorAll('[data-action="remove"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const dow = Number(e.target.dataset.dow);
        const idx = Number(e.target.dataset.idx);
        state.hours[dow].splice(idx, 1);
        save(STORE.hours, state.hours);
        renderHoursGrid();
      });
    });
    grid.querySelectorAll('[data-action="add"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const dow = Number(e.target.dataset.dow);
        if (!state.hours[dow]) state.hours[dow] = [];
        // Find first free 90-min slot
        const next = suggestNextSlot(dow);
        state.hours[dow].push(next);
        save(STORE.hours, state.hours);
        renderHoursGrid();
      });
    });
    grid.querySelectorAll('[data-action="day-toggle"]').forEach((inp) => {
      inp.addEventListener("change", (e) => {
        const dow = Number(e.target.dataset.dow);
        if (e.target.checked) {
          if (!state.hours[dow] || state.hours[dow].length === 0) {
            state.hours[dow] = [{ from: "10:00", to: "13:00" }];
          }
        } else {
          state.hours[dow] = [];
        }
        save(STORE.hours, state.hours);
        renderHoursGrid();
      });
    });
  }

  function suggestNextSlot(dow) {
    const taken = (state.hours[dow] || [])
      .map((r) => ({ s: hmToMin(r.from), e: hmToMin(r.to) }))
      .sort((a, b) => a.s - b.s);
    for (let m = 9 * 60; m + 90 <= 21 * 60; m += 30) {
      const e = m + 90;
      const overlap = taken.some((t) => m < t.e && e > t.s);
      if (!overlap) return { from: minToHm(m), to: minToHm(e) };
    }
    return { from: "10:00", to: "13:00" };
  }

  function hmToMin(s) {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  }
  function minToHm(m) {
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  }

  // ─────────── Week grid ───────────

  let weekAnchor = startOfWeek(new Date());

  function startOfWeek(d) {
    // Monday-based week, but show Sun-Sat in the grid; this returns the Sunday of the week containing d
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const dow = x.getDay(); // 0=Sun
    x.setDate(x.getDate() - dow);
    return x;
  }

  function setupWeekGrid() {
    $("#prev-week").addEventListener("click", () => {
      weekAnchor = new Date(weekAnchor.getTime() - 7 * 86400000);
      renderWeekGrid();
    });
    $("#next-week").addEventListener("click", () => {
      weekAnchor = new Date(weekAnchor.getTime() + 7 * 86400000);
      renderWeekGrid();
    });
    $("#this-week").addEventListener("click", () => {
      weekAnchor = startOfWeek(new Date());
      renderWeekGrid();
    });

    const input = $("#extra-tz-input");
    input.addEventListener("change", () => {
      const z = (input.value || "").trim();
      if (!z) return;
      if (!isValidZone(z)) {
        input.setCustomValidity(`Unknown timezone: ${z}`);
        input.reportValidity();
        return;
      }
      input.setCustomValidity("");
      if (!state.extraTzs.includes(z)) {
        state.extraTzs.push(z);
        save(STORE.extraTzs, state.extraTzs);
        renderWeekGrid();
      }
      input.value = "";
    });
  }

  function renderWeekGrid() {
    // Week label
    const end = new Date(weekAnchor.getTime() + 6 * 86400000);
    const fmt = (d) =>
      new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }).format(d);
    $("#week-label").textContent = `${fmt(weekAnchor)} – ${fmt(end)}, ${end.getFullYear()}`;

    // Extra chips
    const chips = $("#extra-chips");
    chips.innerHTML = state.extraTzs
      .map(
        (z) =>
          `<span class="chip">${z} <button data-z="${z}" aria-label="Remove ${z}">×</button></span>`
      )
      .join("");
    chips.querySelectorAll("button").forEach((b) => {
      b.addEventListener("click", () => {
        state.extraTzs = state.extraTzs.filter((z) => z !== b.dataset.z);
        save(STORE.extraTzs, state.extraTzs);
        renderWeekGrid();
      });
    });

    // Build the grid: rows = zones, columns = days
    const zones = [state.myTz, ...state.extraTzs];
    const grid = $("#week-grid");
    grid.innerHTML = "";

    // Header row
    const corner = document.createElement("div");
    corner.className = "wg-cell wg-head wg-rowlabel";
    corner.textContent = "Zone";
    grid.appendChild(corner);
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAnchor.getTime() + i * 86400000);
      const head = document.createElement("div");
      head.className = "wg-cell wg-head";
      head.innerHTML = `<span class="dow">${DAY_SHORT[d.getDay()]}</span><span class="dom">${d.getDate()}</span>`;
      grid.appendChild(head);
    }

    // Body rows
    zones.forEach((zone) => {
      const label = document.createElement("div");
      label.className = "wg-cell wg-rowlabel";
      const abbr = tzAbbrev(zone);
      const off = tzOffsetLabel(zone);
      label.innerHTML = `${zoneToLabel(zone)}<br><span class="muted small">${abbr} · ${off}</span>`;
      grid.appendChild(label);

      for (let i = 0; i < 7; i++) {
        const cell = document.createElement("div");
        const cellDate = new Date(weekAnchor.getTime() + i * 86400000);
        const dayInfo = describeDayInZone(cellDate, zone);
        cell.className = "wg-cell " + dayInfo.cssClass;
        cell.innerHTML = dayInfo.html;
        cell.title = dayInfo.title;
        grid.appendChild(cell);
      }
    });
  }

  /** Returns cssClass + html for a (date, zone) cell */
  function describeDayInZone(date, zone) {
    // For each of the 7 day cells (in myTz calendar), figure out what
    // weekday it is *in that zone* and what's open / booked.
    const myDateUtcMidnight = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      )
    );
    // What weekday is this in the target zone?
    const dowStr = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      weekday: "short",
    }).format(myDateUtcMidnight);
    const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dow = dowMap[dowStr];

    const ranges = state.hours[dow] || [];
    const open = ranges.length > 0;

    // Bookings whose UTC instant falls inside the day-in-this-zone
    // Easier: get the yyyy-mm-dd string for the cell's date in this zone,
    // and compare to the booking's date (stored in my tz). But bookings
    // store myTz date+time → we need to convert each booking to the zone
    // and check if it lands on the cell's date.
    const zoneDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(myDateUtcMidnight);

    const todaysBookings = state.bookings
      .map((b) => {
        const utc = zonedTimeToUtc(b.date, b.time, state.myTz);
        const bd = new Intl.DateTimeFormat("en-CA", {
          timeZone: zone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(utc);
        const bt = fmtTimeInZone(utc, zone);
        return { ...b, utc, zoneDate: bd, zoneTime: bt };
      })
      .filter((b) => b.zoneDate === zoneDateStr);

    let cssClass = open ? "open" : "";
    let titleParts = [`${zoneToLabel(zone)}`, `${dowStr}`];
    if (open) {
      titleParts.push(
        `Hours: ${ranges.map((r) => `${r.from}–${r.to}`).join(", ")} (your time)`
      );
    } else {
      titleParts.push("Closed (your time)");
    }
    let html = "";
    if (open) {
      html = ranges
        .map(
          (r) =>
            `<span class="label">${r.from}–${r.to}</span>`
        )
        .join("");
    }
    if (todaysBookings.length > 0) {
      cssClass = "booked";
      html = todaysBookings
        .map(
          (b) =>
            `<span class="label">${b.zoneTime} ${b.name}${
              b.tz === zone ? "" : ` (${b.tz.split("/").pop()})`
            }</span>`
        )
        .join("");
      titleParts.push(
        `Bookings: ${todaysBookings.map((b) => `${b.name} @ ${b.zoneTime}`).join("; ")}`
      );
    }
    return { cssClass, html, title: titleParts.join("\n") };
  }

  // ─────────── Bookings ───────────

  function setupBookings() {
    const form = $("#booking-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#b-name").value.trim();
      const tz = $("#b-tz").value.trim();
      const type = $("#b-type").value;
      const date = $("#b-date").value;
      const time = $("#b-time").value;
      if (!name || !isValidZone(tz) || !date || !time) {
        if (!isValidZone(tz)) {
          $("#b-tz").setCustomValidity(`Unknown timezone: ${tz}`);
          $("#b-tz").reportValidity();
        }
        return;
      }
      $("#b-tz").setCustomValidity("");
      state.bookings.push({
        id: uid(),
        name,
        tz,
        type,
        date,
        time,
        createdAt: new Date().toISOString(),
      });
      // Sort by upcoming
      state.bookings.sort((a, b) =>
        (a.date + a.time).localeCompare(b.date + b.time)
      );
      save(STORE.bookings, state.bookings);
      form.reset();
      renderBookings();
      renderWeekGrid();
    });
    renderBookings();
  }

  function renderBookings() {
    const ul = $("#bookings");
    if (state.bookings.length === 0) {
      ul.innerHTML = `<li class="empty">No sessions yet. Add one above ✨</li>`;
      return;
    }
    ul.innerHTML = state.bookings
      .map((b) => {
        // Compute client's-local time for this booking
        const utc = zonedTimeToUtc(b.date, b.time, state.myTz);
        const theirFmt = new Intl.DateTimeFormat(undefined, {
          timeZone: b.tz,
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(utc);
        return `
          <li data-id="${b.id}">
            <div>
              <div class="who">${escapeHtml(b.name)}<span class="type ${b.type}">${b.type}</span></div>
              <div class="meta">
                You: ${b.date} ${b.time} (${state.myTz})
                · Them: ${theirFmt} (${b.tz})
              </div>
            </div>
            <button class="danger" data-id="${b.id}" data-action="delete">Remove</button>
          </li>
        `;
      })
      .join("");
    ul.querySelectorAll('[data-action="delete"]').forEach((b) => {
      b.addEventListener("click", () => {
        const id = b.dataset.id;
        state.bookings = state.bookings.filter((x) => x.id !== id);
        save(STORE.bookings, state.bookings);
        renderBookings();
        renderWeekGrid();
      });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  // ─────────── Wire it all up ───────────

  function init() {
    populateTzSelects();
    $("#my-tz").addEventListener("change", (e) => {
      state.myTz = e.target.value;
      save(STORE.myTz, state.myTz);
      tickMyNow();
      renderWeekGrid();
      // Re-run quick convert if there's an input
      $("#client-tz-input").dispatchEvent(new Event("input"));
    });

    tickMyNow();
    setInterval(tickMyNow, 30 * 1000);

    setupQuickConvert();
    setupWeeklyHours();
    setupWeekGrid();
    setupBookings();
    renderWeekGrid();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
