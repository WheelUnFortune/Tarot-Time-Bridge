# 🕯️ Tarot Time Bridge

A quiet little tool for tarot readers who book across timezones.

You live in Spain. Your clients live everywhere. This app helps you:

- **Convert** a time a client gives you (e.g. "Tuesday at 7pm my time, Texas") into your Spain time.
- **Set** your weekly working hours, once.
- **See** your whole week side-by-side in multiple timezones.
- **Track** who's booked, and show each booking in *their* local time as well as yours.

Everything runs in the browser. No accounts, no servers, no tracking. Your working hours and bookings live in your browser's `localStorage` — they never leave your device.

## ✨ Features

| Section | What it does |
| --- | --- |
| **Quick convert** | Type a date + time + a timezone → instantly see it in yours. Includes an "outside your hours" warning. |
| **My weekly hours** | Per-day, multiple time ranges (e.g. `10:00–13:30` and `17:00–20:30`). Saved locally. |
| **This week, side-by-side** | A row per timezone, columns for each day. Open hours, bookings, and conflicts all show up at a glance. |
| **Booked sessions** | Add a session (client name, their timezone, in-person/remote, your local time) and see it rendered as a "yellow" block in the week grid. |

## 🛠️ Stack

- **Vite + React 18 + TypeScript** — fast dev server, type-safe
- **Tailwind CSS** — utility-first styling, dark mystical theme
- **shadcn/ui** — accessible primitives (Button, Input, Popover, Command, Select, Dialog, Switch, Card, Label)
- **luxon** — timezone math (`DateTime.fromObject(...).setZone(...)`)
- **lucide-react** — icons
- **localStorage** — persistence (tiny `useLocalStorage` hook)
- **cmdk** — the search engine behind the timezone combobox

## 🚀 Use it

### Run locally

```bash
npm install
npm run dev
# open the printed URL (default http://localhost:5173)
```

### Build for production

```bash
npm run build
npm run preview   # serve dist/ locally
```

The build output goes to `dist/`. Drop it on any static host (GitHub Pages, Netlify, Cloudflare Pages, …).

### Option C — Open the file (no build)
The production build is fully static. If you prefer a one-file setup, you can
serve `dist/index.html` from any static server; no backend is required.

```bash
npx serve dist
```

## 🧠 How it works

- All timezone math is done with `luxon` on top of the browser's IANA database. No API calls, no network.
- Persistence is plain `localStorage`. To wipe state: open DevTools → Application → Local Storage → clear.
- The "side-by-side" week is computed dynamically: each cell evaluates *what day-of-week and date the cell represents in the target timezone*, then looks up your open hours and overlays any bookings whose UTC instant falls in that day.

## 🗂️ Project structure

```
tarot-time-bridge/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig*.json
├── components.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── ui/            # shadcn primitives
    │   ├── QuickConvert.tsx
    │   ├── WeeklyHours.tsx
    │   ├── WeekGrid.tsx
    │   ├── Bookings.tsx
    │   └── TimezonePicker.tsx
    └── lib/
        ├── time.ts        # luxon-backed helpers
        ├── time.test.ts   # `npm run test:tz`
        ├── storage.ts     # useLocalStorage hook
        ├── utils.ts       # cn() class merger
        └── zones.ts       # curated IANA list + label overrides
```

## 🛠️ Customising

- **Default hours**: edit `DEFAULT_HOURS` near the top of `src/lib/time.ts`.
- **Default extra timezones**: edit `DEFAULT_EXTRA_TZS` in the same file.
- **Zone label overrides** (e.g. `America/Chicago` → "Chicago / Dallas"): edit `ZONE_LABELS` in `src/lib/time.ts`.
- **Curated zone picker list**: edit `CURATED_ZONES` in `src/lib/time.ts`.
- **Colors / theme**: tweak the HSL CSS variables at the top of `src/index.css` (`--gold`, `--violet`, etc).

## 📜 License

MIT — do whatever you want, just keep the copyright. See `LICENSE`.
