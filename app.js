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
        range("2026-07-23", "2026-07-26", "7/23-7/26"),
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
  dateDetail: document.querySelector("#dateDetail"),
  targetSummary: document.querySelector("#targetSummary"),
  sourceGrid: document.querySelector("#sourceGrid"),
  trackedPeople: document.querySelector("#trackedPeople"),
  trackedDates: document.querySelector("#trackedDates"),
  bestScore: document.querySelector("#bestScore")
};

const storageKey = "my-way-planner-oots-v1";
const captains = new Set(["Joe", "Sean"]);
const captainOrder = ["Joe", "Sean"];
let selectedDateKey = null;
const monthNames = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const compactDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const fullDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const slots = [
  {
    id: "morning",
    name: "Morning",
    shortName: "AM",
    timeLabel: "9am-4pm",
    startHour: 9,
    endHour: 16,
    endOffsetDays: 0
  },
  {
    id: "evening",
    name: "Evening",
    shortName: "PM",
    timeLabel: "5pm-8am",
    startHour: 17,
    endHour: 8,
    endOffsetDays: 1
  }
];
const targetSlots = [
  targetSlot("2026-07-10", "16:00", null, "Chris Lake Navy Pier Open Air"),
  targetSlot("2026-07-11", "16:00", null, "Chris Lake Navy Pier Open Air"),
  targetDate("2026-07-30", "Lollapalooza"),
  targetDate("2026-07-31", "Lollapalooza"),
  targetDate("2026-08-01", "Lollapalooza"),
  targetDate("2026-08-02", "Lollapalooza"),
  targetSlot("2026-08-15", "10:30", "15:00", "Air and Water show"),
  targetSlot("2026-08-16", "10:30", "15:00", "Air and Water show")
];

function range(start, end) {
  return { start, end };
}

function targetSlot(date, startTime, endTime, title) {
  return { date, startTime, endTime, title };
}

function targetDate(date, title) {
  return { date, title };
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

function dateAtHour(date, hour) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);
}

function dateAtTime(date, time) {
  const { hour, minute } = parseTime(time);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
}

function parseTime(value) {
  const [hour, minute] = value.split(":").map(Number);
  return { hour, minute };
}

function eachDay(start, end) {
  const days = [];
  for (let day = parseDate(start); day <= parseDate(end); day = addDays(day, 1)) {
    days.push(new Date(day));
  }
  return days;
}

function slotWindow(date, slot, length) {
  return {
    start: dateAtHour(date, slot.startHour),
    end: dateAtHour(addDays(date, length - 1 + slot.endOffsetDays), slot.endHour)
  };
}

function timedOverlap(date, slot, length, rangeItem) {
  const event = slotWindow(date, slot, length);
  const rangeStart = parseDate(rangeItem.start);
  const rangeEnd = addDays(parseDate(rangeItem.end), 1);
  return rangeStart < event.end && rangeEnd > event.start;
}

function allDayOverlap(date, length, rangeItem) {
  const eventStart = toKey(date);
  const eventEnd = toKey(addDays(date, length - 1));
  return rangeItem.start <= eventEnd && rangeItem.end >= eventStart;
}

function blocksSlot(date, slot, length, rangeItem) {
  if (rangeItem.block === "timed") {
    return timedOverlap(date, slot, length, rangeItem);
  }
  return allDayOverlap(date, length, rangeItem);
}

function selectedPeople() {
  return planner.people.filter((person, index) => {
    const input = els.peopleFilters.querySelector(`[data-person-index="${index}"]`);
    return input ? input.checked : true;
  });
}

function conflictsForSlot(date, slot, length, people = selectedPeople()) {
  return people.flatMap((person) =>
    person.ranges
      .filter((item) => blocksSlot(date, slot, length, item))
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
  const selectedDate = selectedDateKey ? parseDate(selectedDateKey) : null;
  if (selectedDate && (selectedDate < parseDate(els.startDate.value) || selectedDate > parseDate(els.endDate.value))) {
    selectedDateKey = null;
  }

  const people = selectedPeople();
  const length = Number(els.eventLength.value);
  const starts = candidateStarts(els.startDate.value, els.endDate.value, length, els.weekendsOnly.checked);
  const ranked = starts
    .flatMap((date) =>
      slots.map((slot) => {
        const conflicts = conflictsForSlot(date, slot, length, people);
        return {
          date,
          slot,
          conflicts,
          score: scoreFor(conflicts, people.length)
        };
      })
    )
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.conflicts.length - b.conflicts.length ||
        a.date - b.date ||
        slots.indexOf(a.slot) - slots.indexOf(b.slot)
    );

  renderBest(ranked.slice(0, 9), people.length, length);
  renderCalendar(people);
  renderDateDetail(people);
  renderTargetSummary();

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
          <span class="pick__slot">${pick.slot.name} · ${pick.slot.timeLabel}</span>
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

function targetSlotsForDate(date) {
  const dateKey = typeof date === "string" ? date : toKey(date);
  return targetSlots.filter((item) => item.date === dateKey);
}

function targetWindow(item) {
  if (!item.startTime) return null;
  const date = parseDate(item.date);
  const start = dateAtTime(date, item.startTime);
  const end = item.endTime ? dateAtTime(date, item.endTime) : new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

function targetOverlapsSlot(date, slot, item) {
  const event = targetWindow(item);
  if (!event) return false;
  const slotEvent = slotWindow(date, slot, 1);
  return event.start < slotEvent.end && event.end > slotEvent.start;
}

function targetSlotIdsForDate(date, targets) {
  return new Set(
    targets.flatMap((item) =>
      slots
        .filter((slot) => targetOverlapsSlot(date, slot, item))
        .map((slot) => slot.id)
    )
  );
}

function timeLabel(value) {
  const { hour, minute } = parseTime(value);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function targetTimeLabel(item) {
  if (!item.startTime) return "All Day";
  if (!item.endTime) return timeLabel(item.startTime);
  return `${timeLabel(item.startTime)}-${timeLabel(item.endTime)}`;
}

function renderTargetSummary() {
  const grouped = targetSlots.reduce((groups, item) => {
    if (!groups.has(item.title)) {
      groups.set(item.title, []);
    }
    groups.get(item.title).push(item);
    return groups;
  }, new Map());

  els.targetSummary.innerHTML = `
    <div class="target-summary__head">
      <p class="eyebrow">Target Dates</p>
      <strong>${targetSlots.length} slots</strong>
    </div>
    <div class="target-summary__list">
      ${[...grouped.entries()].map(targetGroupMarkup).join("")}
    </div>
  `;
}

function targetGroupMarkup([title, items]) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || ""));
  return `
    <article class="target-summary__item">
      <strong>${escapeHtml(title)}</strong>
      <div>
        ${sorted.map((item) => `<span class="target-summary__chip">${escapeHtml(targetSummaryDateLabel(item))}</span>`).join("")}
      </div>
    </article>
  `;
}

function targetSummaryDateLabel(item) {
  const date = compactDate.format(parseDate(item.date));
  return `${date}, ${targetTimeLabel(item)}`;
}

function renderCalendar(people) {
  const months = [];
  const start = parseDate(els.startDate.value);
  const end = parseDate(els.endDate.value);
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    months.push(new Date(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  els.calendar.innerHTML = months.map((month) => monthMarkup(month, people, start, end)).join("");
}

function monthMarkup(month, people, start, end) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const visibleStart = start > first ? start : first;
  const visibleEnd = end < last ? end : last;
  const blanks = Array.from({ length: visibleStart.getDay() }, () => `<div class="day is-outside"></div>`);
  const days = eachDay(toKey(visibleStart), toKey(visibleEnd)).map((date) => {
    const dateKey = toKey(date);
    const targets = targetSlotsForDate(dateKey);
    const targetSlotIds = targetSlotIdsForDate(date, targets);
    const targetOnDate = targets.length > 0 && targetSlotIds.size === 0;
    const daySlots = slots.map((slot) => {
      const conflicts = conflictsForSlot(date, slot, 1, people);
      return {
        slot,
        conflicts,
        level: levelFor(conflicts),
        names: [...new Set(conflicts.map((item) => item.person.split(" ")[0]))],
        isTarget: targetSlotIds.has(slot.id)
      };
    });
    const level = Math.max(...daySlots.map((item) => item.level));
    return `
      <button class="day" data-date="${dateKey}" data-level="${level}" data-target-date="${targetOnDate}" aria-pressed="${dateKey === selectedDateKey}" title="${dayTooltipFor(date, daySlots, people.length, targets)}">
        <strong>${date.getDate()}</strong>
        <span class="slot-list">
          ${daySlots.map((item) => slotMarkup(item)).join("")}
        </span>
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

function renderDateDetail(people) {
  if (!selectedDateKey) {
    els.dateDetail.innerHTML = `
      <div class="date-detail__empty">
        <strong>Select a date</strong>
        <span>Click any calendar day to see who is OOT.</span>
      </div>
    `;
    return;
  }

  const date = parseDate(selectedDateKey);
  const daySlots = slots.map((slot) => ({
    slot,
    conflicts: conflictsForSlot(date, slot, 1, people)
  }));
  const allConflicts = uniqueConflicts(daySlots.flatMap((item) => item.conflicts));
  const targets = targetSlotsForDate(selectedDateKey);

  els.dateDetail.innerHTML = `
    <div class="date-detail__head">
      <div>
        <p class="eyebrow">Selected Date</p>
        <h3>${fullDate.format(date)}</h3>
      </div>
      <span class="date-detail__count">${allConflicts.length ? `${allConflicts.length} OOT` : "All clear"}</span>
    </div>
    <div class="date-detail__summary">
      ${allConflicts.length ? allConflicts.map((name) => `<span class="chip">${escapeHtml(name)}</span>`).join("") : `<span class="chip chip--clear">No one OOT</span>`}
    </div>
    ${targets.length ? `
      <div class="date-detail__targets">
        <strong>Target slots</strong>
        ${targets.map(targetDetailMarkup).join("")}
      </div>
    ` : ""}
    <div class="date-detail__slots">
      ${ootDetailMarkup(daySlots, people.length)}
    </div>
  `;
}

function ootDetailMarkup(daySlots, peopleCount) {
  const allDayPeople = allDayConflicts(daySlots);
  const partialSlots = daySlots
    .map((item) => ({
      ...item,
      conflicts: item.conflicts.filter((conflict) => !allDayPeople.has(conflict.person))
    }))
    .filter((item) => item.conflicts.length);

  if (!allDayPeople.size && !partialSlots.length) {
    return daySlots.map((item) => slotDetailMarkup(item, peopleCount)).join("");
  }

  return [
    allDayPeople.size ? allDayDetailMarkup([...allDayPeople]) : "",
    ...partialSlots.map((item) => slotDetailMarkup(item, peopleCount))
  ].join("");
}

function allDayConflicts(daySlots) {
  const slotIdsByPerson = new Map();
  for (const item of daySlots) {
    for (const conflict of item.conflicts) {
      if (!slotIdsByPerson.has(conflict.person)) {
        slotIdsByPerson.set(conflict.person, new Set());
      }
      slotIdsByPerson.get(conflict.person).add(item.slot.id);
    }
  }

  return new Set(
    [...slotIdsByPerson.entries()]
      .filter(([, slotIds]) => slots.every((slot) => slotIds.has(slot.id)))
      .map(([person]) => person)
  );
}

function allDayDetailMarkup(people) {
  const conflicts = people.map((person) => ({ person }));
  const level = levelFor(conflicts);
  return `
    <section class="slot-detail" data-level="${level}">
      <div>
        <strong>All Day</strong>
        <span>Morning and evening</span>
      </div>
      <div class="slot-detail__people">
        ${people.map((name) => `<span class="chip">${escapeHtml(name)}</span>`).join("")}
      </div>
    </section>
  `;
}

function slotDetailMarkup(item, peopleCount) {
  const conflicts = uniqueConflicts(item.conflicts);
  const level = levelFor(item.conflicts);
  return `
    <section class="slot-detail" data-level="${level}">
      <div>
        <strong>${item.slot.name}</strong>
        <span>${item.slot.timeLabel}</span>
      </div>
      <div class="slot-detail__people">
        ${conflicts.length ? conflicts.map((name) => `<span class="chip">${escapeHtml(name)}</span>`).join("") : `<span class="chip chip--clear">${peopleCount}/${peopleCount} available</span>`}
      </div>
    </section>
  `;
}

function slotMarkup(item) {
  return `<span class="slot-pill" data-level="${item.level}" data-target-slot="${item.isTarget}">${item.slot.shortName}</span>`;
}

function targetDetailMarkup(item) {
  return `
    <article class="target-detail">
      <span>${escapeHtml(targetTimeLabel(item))}</span>
      <strong>${escapeHtml(item.title)}</strong>
    </article>
  `;
}

function dayTooltipFor(date, daySlots, peopleCount, targets = []) {
  const details = daySlots.map((item) => {
    const conflicts = uniqueConflicts(item.conflicts);
    const availability = `${peopleCount - conflicts.length}/${peopleCount} available`;
    const status = conflicts.length ? conflicts.join(", ") : "clear";
    return `${item.slot.name} (${item.slot.timeLabel}): ${availability}; ${status}`;
  });
  const targetDetails = targets.map((item) => `${targetTimeLabel(item)} ${item.title}`);
  return `${compactDate.format(date)}: ${details.join(" | ")}${targetDetails.length ? ` | Targets: ${targetDetails.join("; ")}` : ""}`;
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
  els.calendar.addEventListener("click", (event) => {
    const day = event.target.closest(".day[data-date]");
    if (!day) return;
    selectedDateKey = day.dataset.date;
    renderPlanner();
  });
  [els.startDate, els.endDate, els.eventLength, els.weekendsOnly].forEach((el) => {
    el.addEventListener("input", renderPlanner);
  });
  renderPlanner();
}

boot();
