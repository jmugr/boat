# My Way Summer Planner

Static summer planning app for comparing potential boat/event dates against out-of-town availability.

Open `index.html` directly in a browser. The app has no build step.

## What It Does

- Ranks AM and PM event slots by how many selected people are available.
- Shows a monthly OOT calendar with captain-aware severity colors.
- Lets you click a date to see who is OOT, grouped into `All Day`, `Morning`, and `Evening`.
- Shows target events on the calendar with teal outlines and summarizes all target dates above the calendar.
- Uses a Jeanneau Sun Odyssey 45 DS style banner image from `assets/jeanneau-sun-odyssey-45ds-hero.png`.

## Main Files

- `index.html`: page structure and default controls.
- `styles.css`: layout, calendar styling, target outlines, and responsive behavior.
- `app.js`: OOT data, target dates, conflict logic, ranking, and rendering.
- `docs/site-guide.md`: current behavior and implementation guide.
- `docs/session-build-notes.md`: build history and session notes.

## Verification

For JavaScript syntax checks:

```powershell
node --check app.js
```
