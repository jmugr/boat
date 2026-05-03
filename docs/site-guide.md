# My Way Summer Planner Guide

This site helps pick the best summer event slots by comparing candidate dates and time windows against out-of-town date ranges.

## Files

- `index.html`: page structure and controls.
- `styles.css`: layout, colors, responsive behavior, and calendar severity styles.
- `app.js`: planner data, date ranking logic, sorting, filtering, and rendering.
- `assets/jeanneau-sun-odyssey-45ds-hero.png`: header image.
- `assets/marina-header.png`: previous header image, currently unused.

## Planner Defaults

The default planning window is:

- Start: `2026-05-24`
- End: `2026-10-18`

The default event filter is weekends only. Event length can be changed from 1 to 4 days.

Each candidate day is evaluated in two slots:

- Morning: `9am-4pm`
- Evening: `5pm-8am`

Evening slots cross midnight, so an evening slot on July 23 runs from `2026-07-23 5pm` through `2026-07-24 8am`.

## Climate Normals

Daily Chicago normal average temperature and precipitation are stored in `app.js` in the `climateNormals` object for May through October.

The values are National Weather Service Chicago normals for 1991-2020. The app displays them on calendar days, selected-date details, Best Picks cards, and calendar day tooltips.

Most OOT ranges are date-only ranges and block the full calendar day. That means someone marked OOT on July 24 blocks both the morning and evening slots on July 24, without spilling into July 23's evening slot.

PM-only OOT entries use `slotRange(date, "evening")`. They block the evening slot window for that date, including multi-day candidate windows that overlap that PM period.

## Out-of-town Data

Out-of-town data lives in `app.js` in the `planner.people` array.

Each person has a first name and a list of date ranges:

```js
{
  name: "Joe",
  ranges: [
    range("2026-06-27", "2026-06-28"),
    range("2026-07-17", "2026-07-19")
  ]
}
```

Ranges are inclusive calendar dates. A one-day OOT date uses the same start and end date:

```js
range("2026-06-12", "2026-06-12")
```

PM-only OOT dates use:

```js
slotRange("2026-06-12", "evening")
```

The source list displays these as `PM`.

The site currently does not include on-page OOT management controls. To update OOT dates, edit `planner.people` in `app.js`.

Recent PM-only OOT entries include:

- Aaron: `2026-06-03 PM`, `2026-08-17 PM`
- Joe: `2026-05-30 PM`, `2026-06-03 PM`, `2026-06-12 PM`, `2026-07-11 PM`

Recent full-day or multi-day OOT additions include:

- Aaron: `2026-06-26` through `2026-06-28`
- Aaron: `2026-07-14`

## Holidays

Holiday dates live in `app.js` in the `holidays` array:

```js
holiday("2026-05-25", "Memorial Day")
```

Current holiday entries are:

- Memorial Day: `2026-05-25`
- Juneteenth National Independence Day: `2026-06-19`
- Independence Day observed: `2026-07-03`
- Labor Day: `2026-09-07`
- Columbus Day: `2026-10-12`

The calendar shows holidays with a purple dot directly under the date number. If the selected date is a holiday, the selected-date detail panel shows the holiday name under the date.

## Special Dates

Special dates and event slots live in `app.js` in the `specialSlots` array.

Timed specials use:

```js
specialSlot("2026-08-15", "10:30", "15:00", "Air and Water Show")
```

All-day specials use:

```js
specialDate("2026-07-30", "Lollapalooza")
```

Current special entries are:

- Chris Lake Navy Pier Open Air: `2026-07-10 5:00 PM`
- Chris Lake Navy Pier Open Air: `2026-07-11 5:00 PM`
- Independence Day: `2026-07-04`, all day
- BLVCKSCENE: `2026-07-09` through `2026-07-12`, `9:00 AM-4:00 PM`
- Mac Race Start: `2026-07-11 9:00 AM-4:00 PM`
- Chicago Scene: `2026-07-25 9:00 AM-4:00 PM`
- Lollapalooza: `2026-07-30` through `2026-08-02`, all day
- Air and Water Show Practice: `2026-08-14 9:00 AM-4:00 PM`
- Air and Water Show: `2026-08-15 10:30 AM-3:00 PM`
- Air and Water Show: `2026-08-16 10:30 AM-3:00 PM`
- Navy Pier Summer Fireworks: every Wednesday at `9:00 PM` and every Saturday at `10:00 PM`, `2026-05-23` through `2026-09-05`
- Navy Pier Independence Day Fireworks: `2026-07-04 10:00 PM-10:15 PM`

The calendar indicates specials with a teal outline. If a timed special overlaps one of the app's existing AM or PM slot windows, that slot marker is outlined. If a special is all day or does not fit cleanly inside an existing slot window, the whole date is outlined.

The Special Dates summary at the bottom of the page groups all specials by event name and shows their dates and times.

## Sorting

People are sorted as:

1. Joe
2. Sean
3. Everyone else alphabetically

This order is controlled by:

```js
const captainOrder = ["Joe", "Sean"];
```

## Captains

Joe and Sean are treated as captains:

```js
const captains = new Set(["Joe", "Sean"]);
```

Captain status affects calendar severity colors.

## Calendar Slots And Colors

Each calendar day shows two compact slot markers:

- `AM`: morning slot, `9am-4pm`
- `PM`: evening slot, `5pm-8am`

Available slot markers use the same green fill as clear calendar cells. Slot markers change to yellow, orange, or red when that specific AM/PM slot has conflicts.

Hovering a calendar day shows an outline only. It does not change the cell fill.

Clicking a calendar day opens the selected-date detail panel above the calendar. The panel shows:

- the selected date
- holiday names, if the selected date is a holiday
- the unique people OOT that day
- special slots on that date, if any
- OOT detail by slot

If a person is OOT for both AM and PM on a selected day, they are shown once under `All Day` instead of repeated under both slots.

The calendar color logic is:

- Green: nobody is out of town.
- Yellow: at least one non-captain is out of town.
- Orange: Joe or Sean is out of town.
- Red: both Joe and Sean are out of town.

The severity logic is implemented in `levelFor(conflicts)` in `app.js`.

Calendar days use the highest severity from that day's two slots as the day background. The individual `AM` and `PM` markers are also color-coded by their own slot severity.

If anyone is OOT on a calendar day, the day header shows a compact `N OOT` count next to the date number. The count is unique people across that day's AM and PM slots, so a person OOT for both slots is counted once.

Weekend slot indicators appear on slot markers and in the Best Picks cards. A weekend slot is any slot that overlaps Saturday, Sunday, or Friday after `5pm`, so Friday PM is considered a weekend slot.

The legend labels are:

- clear
- someone OOT
- captain OOT
- both captains OOT
- special
- weekend slot
- holiday

Dates before the selected Start date and after the selected End date are not shown. The first and last visible months start at the first visible week needed for the selected range, so hidden out-of-range rows are not rendered.

The CSS colors are implemented with `.day[data-level="0"]` behavior through the base `.day` style, plus:

- `.day[data-level="1"]`: yellow
- `.day[data-level="2"]`: orange
- `.day[data-level="3"]`: red

## Best Picks

The Best Picks section ranks candidate event slots by the number of selected people available.

Ranking flow:

1. Build candidate dates from the selected start/end range.
2. Optionally limit candidates to weekends.
3. Expand each candidate date into morning and evening slots.
4. For each slot, check whether the slot window overlaps any OOT range.
5. Score the slot as selected people minus unavailable people.
6. Sort by best score, then fewest conflicts, then earliest date, then morning before evening.

The top nine candidate slots are shown. Each card displays the date, the slot name, the slot time window, availability, and conflicts.

OOT ranges are stored as inclusive dates. For date-only ranges, overlap checks use calendar-day comparison so all listed OOT dates block the full day only. This keeps date-only OOTs from leaking into neighboring overnight slots. PM-only entries use slot-window overlap checks.

## Filters

The left-side people checkboxes let you include or exclude people from the ranking and calendar conflict calculation. The source data remains unchanged.

## Browser Storage

Earlier in the build, the site supported editing OOTs in the browser and saved changes to `localStorage` under:

```text
my-way-planner-oots-v1
```

The management UI has been temporarily removed, but `loadPlanner()` still reads compatible saved data and normalizes names to first names. If browser-local saved data causes confusion during testing, clear site data for `file:///C:/Projects/boat/index.html` or remove that key from local storage.
