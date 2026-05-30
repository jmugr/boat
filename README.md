# My Way Summer Planner

Static summer planning app for comparing potential boat/event dates against out-of-town availability.

Open `index.html` directly in a browser for the reserved calendar homepage. The summer planner is available at `summer-planner.html`. The app has no build step.

## Local Hosting

From the repo root, run the static server directly:

```powershell
node local-server.js
```

Then open:

- Reserved calendar: `http://127.0.0.1:8000/index.html`
- Summer planner: `http://127.0.0.1:8000/summer-planner.html`

Leave the PowerShell window running while testing. Stop it with `Ctrl+C`.

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

- `index.html`: reserved calendar homepage.
- `summer-planner.html`: summer planner page structure and default controls.
- `reserved-calendar.html`: reserved calendar page kept as a direct link-compatible alias.
- `styles.css`: layout, calendar styling, special, weekend, holiday, and responsive behavior.
- `app.js`: OOT data, holiday data, special dates, conflict logic, ranking, and rendering.
- `docs/site-guide.md`: current behavior and implementation guide.
- `docs/session-build-notes.md`: build history and session notes.

## Firebase RSVP MVP

The Firebase MVP scaffold keeps GitHub Pages as the static host and uses Firestore for public slot data plus RSVP writes.

- `firebase-config.js`: browser Firebase config placeholder. Replace the `replace-with-*` values before using Firebase in production.
- `firebase-client.js`: browser Firestore helpers for `slots`, `rsvps`, and `rsvpSummaries`.
- `firestore.rules`: public slot reads, public RSVP creates, write-only private RSVP docs, and public first-name-only summaries.
- `scripts/seed-firebase.js`: idempotent slot seeding from the current hard-coded reservation data.
- `functions/index.js`: Firestore `rsvps/{rsvpId}` trigger that sends an owner email through Gmail/Nodemailer and records send status.

Seed slots after Firebase credentials and project access are configured:

```powershell
$env:FIREBASE_PROJECT_ID="your-project-id"
node scripts/seed-firebase.js
```

Deploy rules and functions with the Firebase CLI once it is installed and authenticated:

```powershell
firebase deploy --only firestore:rules,firestore:indexes
firebase functions:secrets:set GMAIL_USER
firebase functions:secrets:set GMAIL_PASSWORD
firebase functions:secrets:set EMAIL_TO
firebase deploy --only functions
```

## Verification

For JavaScript syntax checks:

```powershell
node --check app.js
node --check firebase-client.js
node --check firebase-config.js
node --check scripts/seed-firebase.js
node --check functions/index.js
```
