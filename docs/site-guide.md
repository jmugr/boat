# My Way Summer Planner Guide

This site helps pick the best summer event dates by comparing candidate dates against out-of-town date ranges.

## Files

- `index.html`: page structure and controls.
- `styles.css`: layout, colors, responsive behavior, and calendar severity styles.
- `app.js`: planner data, date ranking logic, sorting, filtering, and rendering.
- `assets/marina-header.png`: header image.

## Planner Defaults

The default planning window is:

- Start: `2026-05-25` - Memorial Day 2026
- End: `2026-10-31`

The default event filter is weekends only. Event length can be changed from 1 to 4 days.

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

Ranges are inclusive. A one-day OOT date uses the same start and end date:

```js
range("2026-06-12", "2026-06-12")
```

The site currently does not include on-page OOT management controls. To update OOT dates, edit `planner.people` in `app.js`.

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

## Calendar Colors

The calendar color logic is:

- Green: nobody is out of town.
- Yellow: at least one non-captain is out of town.
- Orange: Joe or Sean is out of town.
- Red: both Joe and Sean are out of town.

The logic is implemented in `levelFor(conflicts)` in `app.js`.

The CSS colors are implemented with `.day[data-level="0"]` behavior through the base `.day` style, plus:

- `.day[data-level="1"]`: yellow
- `.day[data-level="2"]`: orange
- `.day[data-level="3"]`: red

## Best Picks

The Best Picks section ranks candidate event starts by the number of selected people available.

Ranking flow:

1. Build candidate dates from the selected start/end range.
2. Optionally limit candidates to weekends.
3. For each candidate, check whether the event range overlaps any OOT range.
4. Score the candidate as selected people minus unavailable people.
5. Sort by best score, then fewest conflicts, then earliest date.

The top nine candidates are shown.

## Filters

The left-side people checkboxes let you include or exclude people from the ranking and calendar conflict calculation. The source data remains unchanged.

## Browser Storage

Earlier in the build, the site supported editing OOTs in the browser and saved changes to `localStorage` under:

```text
my-way-planner-oots-v1
```

The management UI has been temporarily removed, but `loadPlanner()` still reads compatible saved data and normalizes names to first names. If browser-local saved data causes confusion during testing, clear site data for `file:///C:/Projects/boat/index.html` or remove that key from local storage.

