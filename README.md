# My Way Summer Planner

Static summer planning app for comparing potential boat/event dates against out-of-town availability.

Open `index.html` directly in a browser. The app has no build step.

## What It Does

- Ranks AM and PM event slots by how many selected people are available.
- Shows a monthly OOT calendar with captain-aware severity colors, per-date OOT counts, and AM/PM slot colors.
- Flags weekend slots, including Friday PM, and shows 2026 holiday dates with purple date markers.
- Lets you click a date to see who is OOT, grouped into `All Day`, `Morning`, and `Evening`, with holiday names shown when applicable.
- Shows special events on the calendar with teal outlines and summarizes all special dates at the bottom of the page.
- Shows Chicago daily normal average temperature and precipitation from National Weather Service climate normals.
- Supports PM-only OOT entries for partial-day availability.
- Uses a Jeanneau Sun Odyssey 45 DS style banner image from `assets/jeanneau-sun-odyssey-45ds-hero.png`.

## Main Files

- `index.html`: page structure and default controls.
- `styles.css`: layout, calendar styling, special, weekend, holiday, and responsive behavior.
- `app.js`: OOT data, holiday data, special dates, conflict logic, ranking, and rendering.
- `docs/site-guide.md`: current behavior and implementation guide.
- `docs/session-build-notes.md`: build history and session notes.

## Verification

For JavaScript syntax checks:

```powershell
node --check app.js
```
