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

## 🚀 Use it

### Option A — Open the file (zero setup)
Just open `index.html` in any modern browser. That's it.

### Option B — Host on GitHub Pages (free, shareable)
1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Set source to `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. After a minute or two, GitHub gives you a URL like `https://yourname.github.io/tarot-time-bridge/`.

### Option C — Run a tiny local server (if you want)
```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## 🧠 How it works

- All timezone math is done with the browser's built-in `Intl.DateTimeFormat`. No API calls, no network.
- Persistence is plain `localStorage`. To wipe state: open DevTools → Application → Local Storage → clear.
- The "side-by-side" week is computed dynamically: each cell evaluates *what day-of-week and date the cell represents in the target timezone*, then looks up your open hours and overlays any bookings whose UTC instant falls in that day.

## 🗂️ Files

```
tarot-time-bridge/
├── index.html     # the app shell
├── style.css      # dark mystical theme, mobile-friendly
├── app.js         # all logic, no dependencies
├── README.md
├── LICENSE        # MIT
└── .gitignore
```

## 🛠️ Customising

- **Default hours**: edit the `DEFAULT_HOURS` object near the top of `app.js`.
- **Colors / theme**: tweak the CSS variables at the top of `style.css` (`--gold`, `--violet`, etc).
- **Add new sections**: `index.html` is plain semantic HTML; sections are simple `<section class="card">` blocks.

## 📜 License

MIT — do whatever you want, just keep the copyright. See `LICENSE`.
