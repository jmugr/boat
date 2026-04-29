const planner = {
  year: 2026,
  people: [
    {
      name: "Aaron",
      ranges: [
        range("2026-06-12", "2026-06-12", "June 12"),
        range("2026-06-25", "2026-06-25", "June 25"),
        range("2026-07-03", "2026-07-05", "July 4th weekend")
      ]
    },
    {
      name: "Sean",
      ranges: [
        range("2026-07-04", "2026-07-04", "July 4th"),
        range("2026-07-17", "2026-07-19", "July 17th weekend"),
        range("2026-07-31", "2026-08-09", "7/31-8/9")
      ]
    },
    {
      name: "Jerry",
      ranges: [
        range("2026-05-29", "2026-06-01", "5/29-6/1"),
        range("2026-06-18", "2026-06-21", "6/18-6/21"),
        range("2026-07-03", "2026-07-05", "4th of July weekend"),
        range("2026-07-17", "2026-07-20", "7/17-7/20"),
        range("2026-08-20", "2026-08-23", "8/20-8/23")
      ]
    },
    {
      name: "Johnny",
      ranges: [
        range("2026-05-01", "2026-05-31", "May is very rough", "soft"),
        range("2026-06-05", "2026-06-07", "6/5-6/7"),
        range("2026-08-28", "2026-08-30", "8/28-8/30")
      ]
    },
    {
      name: "Brad",
      ranges: [
        range("2026-06-07", "2026-06-07", "June 7"),
        range("2026-06-12", "2026-06-12", "June 12"),
        range("2026-07-30", "2026-08-02", "July 30-Aug 2"),
        range("2026-08-14", "2026-08-16", "Aug 14-16")
      ]
    },
    {
      name: "Joe",
      ranges: [
        range("2026-06-27", "2026-06-28"),
        range("2026-07-17", "2026-07-19"),
        range("2026-08-17", "2026-09-01"),
        range("2026-09-04", "2026-09-07")
      ]
    }
  ]
};

const joeRennerDefaults = {
  name: "Joe",
  ranges: [
    range("2026-06-27", "2026-06-28"),
    range("2026-07-17", "2026-07-19"),
    range("2026-08-17", "2026-09-01"),
    range("2026-09-04", "2026-09-07")
  ]
};

const els = {
  startDate: document.querySelector("#startDate"),
  endDate: document.querySelector("#endDate"),
  eventLength: document.querySelector("#eventLength"),
  weekendsOnly: document.querySelector("#weekendsOnly"),
  peopleFilters: document.querySelector("#peopleFilters"),
  bestList: document.querySelector("#bestList"),
  calendar: document.querySelector("#calendar"),
  sourceGrid: document.querySelector("#sourceGrid"),
  trackedPeople: document.querySelector("#trackedPeople"),
  trackedDates: document.querySelector("#trackedDates"),
  bestScore: document.querySelector("#bestScore")
};

const storageKey = "my-way-planner-oots-v1";
const captains = new Set(["Joe", "Sean"]);
const captainOrder = ["Joe", "Sean"];
const monthNames = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const compactDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function range(start, end) {
  return { start, end };
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

function eachDay(start, end) {
  const days = [];
  for (let day = parseDate(start); day <= parseDate(end); day = addDays(day, 1)) {
    days.push(new Date(day));
  }
  return days;
}

function overlaps(eventStart, eventEnd, rangeItem) {
  return parseDate(rangeItem.start) <= eventEnd && parseDate(rangeItem.end) >= eventStart;
}

function selectedPeople() {
  return planner.people.filter((person, index) => {
    const input = els.peopleFilters.querySelector(`[data-person-index="${index}"]`);
    return input ? input.checked : true;
  });
}

function conflictsFor(eventStart, length, people = selectedPeople()) {
  const eventEnd = addDays(eventStart, length - 1);
  return people.flatMap((person) =>
    person.ranges
      .filter((item) => overlaps(eventStart, eventEnd, item))
      .map((item) => ({ person: person.name, ...item }))
  );
}

function scoreFor(conflicts, peopleCount) {
  const uniquePeople = new Set(conflicts.map((item) => item.person));
  return peopleCount - uniquePeople.size;
}

function levelFor(conflicts) {
  if (!conflicts.length) return 0;
  const unavailableCaptains = new Set(conflicts.map((item) => item.person).filter((name) => captains.has(name)));
  if (unavailableCaptains.size >= captains.size) return 3;
  if (unavailableCaptains.size > 0) return 2;
  return 1;
}

function renderFilters() {
  sortPeople();
  els.peopleFilters.innerHTML = planner.people
    .map((person, index) => `
      <label class="person-filter">
        <span>${escapeHtml(person.name)}</span>
        <input type="checkbox" data-person-index="${index}" checked>
      </label>
    `)
    .join("");
}

function candidateStarts(start, end, length, weekendsOnly) {
  const lastStart = addDays(parseDate(end), -(length - 1));
  return eachDay(start, toKey(lastStart)).filter((date) => {
    if (!weekendsOnly) return true;
    if (length === 1) return date.getDay() === 5 || date.getDay() === 6 || date.getDay() === 0;
    return date.getDay() === 5 || date.getDay() === 6;
  });
}

function renderPlanner() {
  const people = selectedPeople();
  const length = Number(els.eventLength.value);
  const starts = candidateStarts(els.startDate.value, els.endDate.value, length, els.weekendsOnly.checked);
  const ranked = starts
    .map((date) => {
      const conflicts = conflictsFor(date, length, people);
      return {
        date,
        conflicts,
        score: scoreFor(conflicts, people.length)
      };
    })
    .sort((a, b) => b.score - a.score || a.conflicts.length - b.conflicts.length || a.date - b.date);

  renderBest(ranked.slice(0, 9), people.length, length);
  renderCalendar(people);

  const best = ranked[0]?.score ?? 0;
  els.bestScore.textContent = `${best}/${people.length}`;
}

function renderBest(picks, peopleCount, length) {
  els.bestList.innerHTML = picks
    .map((pick) => {
      const conflicts = uniqueConflicts(pick.conflicts);
      const level = levelFor(pick.conflicts);
      const className = level === 3 ? "is-bad" : level === 2 ? "is-captain" : level === 1 ? "is-warn" : "";
      const label = dateLabel(pick.date, length);
      return `
        <article class="pick ${className}">
          <strong class="pick__date">${label}</strong>
          <span class="pick__score">${pick.score}/${peopleCount} available</span>
          <div class="conflicts">
            ${conflicts.length ? conflicts.map((item) => `<span class="chip">${item}</span>`).join("") : `<span class="chip">No conflicts</span>`}
          </div>
        </article>
      `;
    })
    .join("");
}

function uniqueConflicts(conflicts) {
  const seen = new Map();
  for (const item of conflicts) {
    if (!seen.has(item.person)) {
      seen.set(item.person, item.person);
    }
  }
  return [...seen.values()];
}

function dateLabel(date, length) {
  if (length === 1) return `${weekday.format(date)}, ${compactDate.format(date)}`;
  return `${compactDate.format(date)}-${compactDate.format(addDays(date, length - 1))}`;
}

function renderCalendar(people) {
  const months = [];
  let cursor = new Date(parseDate(els.startDate.value).getFullYear(), parseDate(els.startDate.value).getMonth(), 1);
  const end = parseDate(els.endDate.value);
  while (cursor <= end) {
    months.push(new Date(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  els.calendar.innerHTML = months.map((month) => monthMarkup(month, people)).join("");
}

function monthMarkup(month, people) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const blanks = Array.from({ length: first.getDay() }, () => `<div class="day is-outside"></div>`);
  const days = eachDay(toKey(first), toKey(last)).map((date) => {
    const conflicts = conflictsFor(date, 1, people);
    const level = levelFor(conflicts);
    const names = [...new Set(conflicts.map((item) => item.person.split(" ")[0]))];
    return `
      <button class="day" data-level="${level}" title="${tooltipFor(date, conflicts, people.length)}">
        <strong>${date.getDate()}</strong>
        <span>${names.slice(0, 2).join(", ")}</span>
      </button>
    `;
  });

  return `
    <section class="month">
      <div class="month__title">${monthNames.format(month)}</div>
      <div class="month__grid">
        ${dayNames.map((day) => `<div class="dow">${day}</div>`).join("")}
        ${blanks.join("")}
        ${days.join("")}
      </div>
    </section>
  `;
}

function tooltipFor(date, conflicts, peopleCount) {
  if (!conflicts.length) return `${compactDate.format(date)}: ${peopleCount}/${peopleCount} available`;
  return `${compactDate.format(date)}: ${uniqueConflicts(conflicts).join("; ")}`;
}

function renderSource() {
  sortPeople();
  els.sourceGrid.innerHTML = planner.people
    .map((person) => `
      <article class="source-card">
        <h3>${escapeHtml(person.name)}</h3>
        <ul>
          ${person.ranges.length ? person.ranges.map((item) => `<li>${escapeHtml(dateRangeLabel(item.start, item.end))}</li>`).join("") : "<li>No OOT dates yet</li>"}
        </ul>
      </article>
    `)
    .join("");
}

function renderStats() {
  els.trackedPeople.textContent = planner.people.length;
  els.trackedDates.textContent = planner.people.reduce((total, person) => total + person.ranges.length, 0);
}

function loadPlanner() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (Array.isArray(saved)) {
      planner.people = saved.map(normalizePerson);
    }
  } catch {
    localStorage.removeItem(storageKey);
  }
  ensurePersonRanges(joeRennerDefaults);
  sortPeople();
}

function sortPeople() {
  planner.people.sort((a, b) => {
    const aCaptainIndex = captainOrder.indexOf(a.name);
    const bCaptainIndex = captainOrder.indexOf(b.name);
    if (aCaptainIndex !== -1 || bCaptainIndex !== -1) {
      if (aCaptainIndex === -1) return 1;
      if (bCaptainIndex === -1) return -1;
      return aCaptainIndex - bCaptainIndex;
    }
    return a.name.localeCompare(b.name);
  });
}

function ensurePersonRanges(defaultPerson) {
  const existing = planner.people.find((person) => firstName(person.name).toLowerCase() === defaultPerson.name.toLowerCase());
  if (!existing) {
    planner.people.push(normalizePerson(defaultPerson));
    return;
  }

  existing.name = defaultPerson.name;
  for (const defaultRange of defaultPerson.ranges) {
    const hasRange = existing.ranges.some((item) => item.start === defaultRange.start && item.end === defaultRange.end);
    if (!hasRange) {
      existing.ranges.push(normalizeRange(defaultRange));
    }
  }
}

function normalizePerson(person) {
  return {
    name: firstName(person.name),
    ranges: Array.isArray(person.ranges) ? person.ranges.map(normalizeRange).filter(Boolean) : []
  };
}

function firstName(name) {
  return String(name || "Unnamed").trim().split(/\s+/)[0] || "Unnamed";
}

function normalizeRange(item) {
  if (!item || !item.start || !item.end) return null;
  const start = String(item.start);
  const end = String(item.end);
  const sorted = parseDate(start) <= parseDate(end) ? [start, end] : [end, start];
  return {
    start: sorted[0],
    end: sorted[1]
  };
}

function dateRangeLabel(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (start === end) return compactDate.format(startDate);
  return `${compactDate.format(startDate)}-${compactDate.format(endDate)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function boot() {
  loadPlanner();
  renderStats();
  renderFilters();
  renderSource();
  els.peopleFilters.addEventListener("change", renderPlanner);
  [els.startDate, els.endDate, els.eventLength, els.weekendsOnly].forEach((el) => {
    el.addEventListener("input", renderPlanner);
  });
  renderPlanner();
}

boot();
