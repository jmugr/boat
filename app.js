const planner = {
  year: 2026,
  people: [
    {
      id: "aaron-vander-linde",
      name: "Aaron Vander Linde",
      shortName: "Aaron",
      contact: "6307779420",
      ranges: [
        slotRange("2026-06-03", "evening"),
        range("2026-06-12", "2026-06-12", "June 12"),
        range("2026-06-25", "2026-06-25", "June 25"),
        range("2026-07-14", "2026-07-14", "July 14"),
        range("2026-07-03", "2026-07-05", "July 4th weekend"),
        slotRange("2026-08-17", "evening")
      ]
    },
    {
      id: "sean-kilbane",
      name: "Sean Kilbane",
      shortName: "Sean",
      contact: "4402428580",
      ranges: [
        range("2026-07-04", "2026-07-04", "July 4th"),
        range("2026-07-17", "2026-07-19", "July 17th weekend"),
        range("2026-07-31", "2026-08-09", "7/31-8/9"),
        range("2026-08-20", "2026-08-23")
      ]
    },
    {
      id: "jerry-hand",
      name: "Jerry Hand",
      shortName: "Jerry",
      contact: "7343652707",
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
      id: "johnny-lekosiotis",
      name: "Johnny Lekosiotis",
      shortName: "Johnny",
      contact: "2488606056",
      ranges: [
        range("2026-05-01", "2026-05-31", "May is very rough", "soft"),
        range("2026-06-05", "2026-06-07", "6/5-6/7"),
        range("2026-08-28", "2026-08-30", "8/28-8/30")
      ]
    },
    {
      id: "brad-jamiolkowski",
      name: "Brad Jamiolkowski",
      shortName: "Brad",
      contact: "4124182666",
      ranges: [
        range("2026-06-07", "2026-06-07", "June 7"),
        range("2026-06-12", "2026-06-12", "June 12"),
        range("2026-07-30", "2026-08-02", "July 30-Aug 2"),
        range("2026-08-14", "2026-08-16", "Aug 14-16"),
        range("2026-09-04", "2026-09-13", "Sept 4-13"),
        range("2026-09-21", "2026-09-27", "Sept 21-27")
      ]
    },
    {
      id: "joe-renner",
      name: "Joe Renner",
      shortName: "Joe",
      contact: "8104239965",
      ranges: [
        slotRange("2026-05-30", "evening"),
        slotRange("2026-06-03", "evening"),
        slotRange("2026-06-12", "evening"),
        range("2026-06-27", "2026-06-28"),
        slotRange("2026-07-11", "evening"),
        range("2026-07-17", "2026-07-19"),
        range("2026-08-17", "2026-09-01"),
        range("2026-09-04", "2026-09-07")
      ]
    }
  ]
};

const defaultPeople = planner.people.map(normalizePerson);

const els = {
  startDate: document.querySelector("#startDate"),
  endDate: document.querySelector("#endDate"),
  eventLength: document.querySelector("#eventLength"),
  sortDates: document.querySelector("#sortDates"),
  dayTypeFilter: document.querySelector("#dayTypeFilter"),
  specialFilter: document.querySelector("#specialFilter"),
  minTemp: document.querySelector("#minTemp"),
  topMatches: document.querySelector("#topMatches"),
  showSearchOnCalendar: document.querySelector("#showSearchOnCalendar"),
  dayFilters: document.querySelectorAll("[name='dayFilter']"),
  monthFilters: document.querySelectorAll("[name='monthFilter']"),
  slotFilters: document.querySelectorAll("[name='slotFilter']"),
  dateResultCount: document.querySelector("#dateResultCount"),
  peopleFilters: document.querySelector("#peopleFilters"),
  dateResults: document.querySelector("#dateResults"),
  calendar: document.querySelector("#calendar"),
  dateDetail: document.querySelector("#dateDetail"),
  boatReserved: document.querySelector("#boatReserved"),
  specialSummary: document.querySelector("#specialSummary"),
  sourceGrid: document.querySelector("#sourceGrid"),
  reservedOnlyCalendar: document.querySelector("#reservedOnlyCalendar"),
  reservedOnlyDateDetail: document.querySelector("#reservedOnlyDateDetail"),
  reservedOnlyList: document.querySelector("#reservedOnlyList")
};

const storageKey = "my-way-planner-oots-v1";
const extendedWatersStart = "2026-06-20";
const extendedWatersEnd = "2026-09-20";
const defaultStartDate = "2026-05-24";
const defaultEndDate = "2026-10-18";
const captains = new Set(["Joe", "Sean"]);
const captainOrder = ["Joe", "Sean"];
const crewGuestOfNone = "N/A";
const crewProfileIdPrefix = "crew:";
const seededCrewRsvpIdPrefix = "crew_going_";
let selectedDateKey = null;
const monthNames = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const compactDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const fullDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const fullDateWithYear = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
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
const firebaseSlotState = {
  configured: false,
  loaded: false,
  error: "",
  byKey: new Map()
};
const rsvpState = {
  summariesLoaded: false,
  summariesError: "",
  summariesBySlotId: new Map(),
  profilesLoaded: false,
  profilesError: "",
  profiles: [],
  selectedProfileId: "",
  activeSlot: null,
  submitting: false,
  message: ""
};
const holidays = [
  holiday("2026-05-25", "Memorial Day"),
  holiday("2026-06-19", "Juneteenth National Independence Day"),
  holiday("2026-07-03", "Independence Day observed"),
  holiday("2026-07-04", "Independence Day"),
  holiday("2026-09-07", "Labor Day"),
  holiday("2026-10-12", "Columbus Day")
];
const holidayLookup = new Map(holidays.map((item) => [item.date, item.title]));
const climateNormals = {
  5: [
    [55.4, 0.15], [55.7, 0.14], [56.1, 0.15], [56.4, 0.15], [56.8, 0.14], [57.2, 0.14], [57.5, 0.15], [57.8, 0.15],
    [58.2, 0.15], [58.5, 0.15], [58.9, 0.15], [59.2, 0.15], [59.6, 0.16], [59.9, 0.15], [60.2, 0.14], [60.6, 0.15],
    [60.9, 0.15], [61.2, 0.14], [61.6, 0.15], [61.9, 0.15], [62.3, 0.15], [62.6, 0.15], [62.9, 0.14], [63.3, 0.14],
    [63.6, 0.14], [63.9, 0.13], [64.3, 0.14], [64.6, 0.14], [65.0, 0.13], [65.3, 0.13], [65.6, 0.14]
  ],
  6: [
    [66.0, 0.14], [66.3, 0.13], [66.7, 0.14], [67.0, 0.14], [67.4, 0.15], [67.7, 0.14], [68.0, 0.14], [68.4, 0.15],
    [68.7, 0.14], [69.1, 0.14], [69.4, 0.14], [69.7, 0.15], [70.0, 0.14], [70.4, 0.14], [70.7, 0.14], [71.0, 0.14],
    [71.3, 0.13], [71.6, 0.14], [71.9, 0.14], [72.1, 0.13], [72.4, 0.14], [72.7, 0.14], [72.9, 0.13], [73.2, 0.13],
    [73.4, 0.13], [73.6, 0.13], [73.8, 0.13], [74.0, 0.13], [74.2, 0.12], [74.4, 0.12]
  ],
  7: [
    [74.6, 0.11], [74.7, 0.11], [74.9, 0.10], [75.0, 0.11], [75.1, 0.11], [75.2, 0.11], [75.3, 0.11], [75.4, 0.11],
    [75.5, 0.12], [75.6, 0.13], [75.6, 0.12], [75.7, 0.12], [75.7, 0.11], [75.7, 0.12], [75.7, 0.11], [75.7, 0.12],
    [75.7, 0.12], [75.7, 0.11], [75.7, 0.12], [75.7, 0.12], [75.7, 0.13], [75.7, 0.12], [75.6, 0.13], [75.6, 0.13],
    [75.6, 0.13], [75.5, 0.13], [75.5, 0.13], [75.4, 0.12], [75.4, 0.13], [75.3, 0.14], [75.3, 0.13]
  ],
  8: [
    [75.2, 0.15], [75.1, 0.15], [75.1, 0.14], [75.0, 0.14], [75.0, 0.14], [74.9, 0.14], [74.8, 0.12], [74.7, 0.13],
    [74.7, 0.14], [74.6, 0.13], [74.5, 0.14], [74.4, 0.14], [74.3, 0.14], [74.2, 0.15], [74.1, 0.14], [74.0, 0.15],
    [73.9, 0.15], [73.8, 0.14], [73.7, 0.13], [73.6, 0.14], [73.4, 0.13], [73.3, 0.13], [73.1, 0.13], [73.0, 0.13],
    [72.8, 0.13], [72.6, 0.13], [72.4, 0.13], [72.2, 0.13], [72.0, 0.13], [71.8, 0.14], [71.5, 0.14]
  ],
  9: [
    [71.3, 0.12], [71.0, 0.12], [70.7, 0.11], [70.5, 0.12], [70.2, 0.12], [69.9, 0.11], [69.5, 0.11], [69.2, 0.11],
    [68.9, 0.10], [68.6, 0.10], [68.2, 0.11], [67.8, 0.10], [67.5, 0.10], [67.1, 0.10], [66.7, 0.10], [66.3, 0.10],
    [65.9, 0.11], [65.5, 0.10], [65.1, 0.11], [64.7, 0.11], [64.3, 0.11], [63.9, 0.11], [63.5, 0.10], [63.1, 0.11],
    [62.6, 0.11], [62.2, 0.10], [61.8, 0.10], [61.4, 0.10], [61.0, 0.09], [60.5, 0.10]
  ],
  10: [
    [60.1, 0.11], [59.7, 0.12], [59.3, 0.11], [58.9, 0.11], [58.5, 0.11], [58.1, 0.11], [57.6, 0.11], [57.2, 0.11],
    [56.8, 0.11], [56.4, 0.12], [56.0, 0.11], [55.6, 0.12], [55.2, 0.11], [54.8, 0.11], [54.4, 0.12], [54.0, 0.11],
    [53.7, 0.11], [53.3, 0.12], [52.9, 0.11], [52.5, 0.10], [52.1, 0.11], [51.7, 0.11], [51.3, 0.11], [50.9, 0.11],
    [50.5, 0.11], [50.0, 0.11], [49.6, 0.11], [49.2, 0.11], [48.8, 0.11], [48.4, 0.10], [48.0, 0.10]
  ]
};
let boatReservations = [
  boatReservation("2026-06-05", "evening"),
  boatReservation("2026-06-09", "evening"),
  boatReservation("2026-06-16", "evening"),
  boatReservation("2026-06-19", "morning"),
  boatReservation("2026-06-27", "morning"),
  boatReservation("2026-07-01", "evening"),
  boatReservation("2026-07-04", "morning"),
  boatReservation("2026-07-10", "evening"),
  boatReservation("2026-07-20", "evening"),
  boatReservation("2026-07-25", "morning"),
  boatReservation("2026-07-27", "evening"),
  boatReservation("2026-08-13", "evening"),
  boatReservation("2026-08-18", "evening"),
  boatReservation("2026-09-03", "evening"),
  boatReservation("2026-09-10", "morning"),
  boatReservation("2026-09-10", "evening"),
  boatReservation("2026-09-11", "morning"),
  boatReservation("2026-09-11", "evening"),
  boatReservation("2026-09-12", "morning"),
  boatReservation("2026-09-20", "morning")
];
let otherReservations = [
  otherReservation("2026-05-24", "morning"),
  otherReservation("2026-05-25", "morning"),
  otherReservation("2026-05-29", "evening"),
  otherReservation("2026-05-30", "morning"),
  otherReservation("2026-05-31", "morning"),
  otherReservation("2026-06-02", "morning"),
  otherReservation("2026-06-02", "evening"),
  otherReservation("2026-06-03", "evening"),
  otherReservation("2026-06-04", "morning", "Maintenance"),
  otherReservation("2026-06-04", "evening"),
  otherReservation("2026-06-06", "morning"),
  otherReservation("2026-06-08", "evening"),
  otherReservation("2026-06-09", "morning"),
  otherReservation("2026-06-10", "morning"),
  otherReservation("2026-06-10", "evening"),
  otherReservation("2026-06-11", "evening"),
  otherReservation("2026-06-12", "morning", "Maintenance"),
  otherReservation("2026-06-12", "evening"),
  otherReservation("2026-06-13", "morning"),
  otherReservation("2026-06-13", "evening"),
  otherReservation("2026-06-14", "morning"),
  otherReservation("2026-06-15", "morning", "Maintenance"),
  otherReservation("2026-06-15", "evening"),
  otherReservation("2026-06-17", "morning"),
  otherReservation("2026-06-18", "evening"),
  otherReservation("2026-06-20", "morning"),
  otherReservation("2026-06-20", "evening"),
  otherReservation("2026-06-21", "morning"),
  otherReservation("2026-06-21", "evening"),
  otherReservation("2026-06-22", "evening"),
  otherReservation("2026-06-23", "morning", "Maintenance"),
  otherReservation("2026-06-24", "evening"),
  otherReservation("2026-06-25", "evening"),
  otherReservation("2026-06-26", "evening"),
  otherReservation("2026-06-28", "morning"),
  otherReservation("2026-07-01", "morning", "Maintenance"),
  otherReservation("2026-07-02", "evening"),
  otherReservation("2026-07-03", "morning"),
  otherReservation("2026-07-05", "morning"),
  otherReservation("2026-07-05", "evening"),
  otherReservation("2026-07-06", "evening"),
  otherReservation("2026-07-07", "morning"),
  otherReservation("2026-07-07", "evening"),
  otherReservation("2026-07-08", "evening"),
  otherReservation("2026-07-09", "morning", "Maintenance"),
  otherReservation("2026-07-09", "evening"),
  otherReservation("2026-07-10", "morning"),
  otherReservation("2026-07-11", "morning"),
  otherReservation("2026-07-11", "evening"),
  otherReservation("2026-07-12", "morning"),
  otherReservation("2026-07-12", "evening"),
  otherReservation("2026-07-13", "morning"),
  otherReservation("2026-07-13", "evening"),
  otherReservation("2026-07-14", "morning"),
  otherReservation("2026-07-14", "evening"),
  otherReservation("2026-07-15", "morning"),
  otherReservation("2026-07-15", "evening"),
  otherReservation("2026-07-16", "morning"),
  otherReservation("2026-07-16", "evening"),
  otherReservation("2026-07-17", "morning"),
  otherReservation("2026-07-17", "evening"),
  otherReservation("2026-07-18", "morning"),
  otherReservation("2026-07-18", "evening"),
  otherReservation("2026-07-19", "morning"),
  otherReservation("2026-07-20", "morning", "Maintenance"),
  otherReservation("2026-07-21", "morning"),
  otherReservation("2026-07-21", "evening"),
  otherReservation("2026-07-22", "evening"),
  otherReservation("2026-07-23", "morning"),
  otherReservation("2026-07-23", "evening"),
  otherReservation("2026-07-24", "morning"),
  otherReservation("2026-07-24", "evening"),
  otherReservation("2026-07-25", "evening"),
  otherReservation("2026-07-26", "morning"),
  otherReservation("2026-07-26", "evening"),
  otherReservation("2026-07-28", "morning", "Maintenance"),
  otherReservation("2026-07-28", "evening"),
  otherReservation("2026-07-29", "evening"),
  otherReservation("2026-07-30", "evening"),
  otherReservation("2026-07-31", "evening"),
  otherReservation("2026-08-01", "morning"),
  otherReservation("2026-08-02", "morning"),
  otherReservation("2026-08-04", "evening"),
  otherReservation("2026-08-05", "morning", "Maintenance"),
  otherReservation("2026-08-05", "evening"),
  otherReservation("2026-08-06", "morning"),
  otherReservation("2026-08-06", "evening"),
  otherReservation("2026-08-07", "morning"),
  otherReservation("2026-08-07", "evening"),
  otherReservation("2026-08-08", "morning"),
  otherReservation("2026-08-08", "evening"),
  otherReservation("2026-08-09", "morning"),
  otherReservation("2026-08-10", "evening"),
  otherReservation("2026-08-11", "evening"),
  otherReservation("2026-08-12", "evening"),
  otherReservation("2026-08-13", "morning", "Maintenance"),
  otherReservation("2026-08-14", "morning"),
  otherReservation("2026-08-15", "morning"),
  otherReservation("2026-08-16", "morning"),
  otherReservation("2026-08-16", "evening"),
  otherReservation("2026-08-17", "morning"),
  otherReservation("2026-08-17", "evening"),
  otherReservation("2026-08-19", "evening"),
  otherReservation("2026-08-20", "evening"),
  otherReservation("2026-08-21", "morning", "Maintenance"),
  otherReservation("2026-08-21", "evening"),
  otherReservation("2026-08-22", "morning"),
  otherReservation("2026-08-22", "evening"),
  otherReservation("2026-08-24", "morning", "Maintenance"),
  otherReservation("2026-08-25", "morning"),
  otherReservation("2026-08-25", "evening"),
  otherReservation("2026-08-26", "evening"),
  otherReservation("2026-08-27", "morning"),
  otherReservation("2026-08-27", "evening"),
  otherReservation("2026-08-28", "morning"),
  otherReservation("2026-08-29", "morning"),
  otherReservation("2026-08-30", "morning"),
  otherReservation("2026-09-01", "morning", "Maintenance"),
  otherReservation("2026-09-02", "morning"),
  otherReservation("2026-09-02", "evening"),
  otherReservation("2026-09-05", "evening"),
  otherReservation("2026-09-06", "evening"),
  otherReservation("2026-09-08", "evening"),
  otherReservation("2026-09-09", "morning", "Maintenance"),
  otherReservation("2026-09-09", "evening"),
  otherReservation("2026-09-12", "evening"),
  otherReservation("2026-09-13", "morning"),
  otherReservation("2026-09-13", "evening"),
  otherReservation("2026-09-15", "evening"),
  otherReservation("2026-09-16", "morning", "Maintenance"),
  otherReservation("2026-09-16", "evening"),
  otherReservation("2026-09-17", "morning"),
  otherReservation("2026-09-17", "evening"),
  otherReservation("2026-09-18", "morning"),
  otherReservation("2026-09-18", "evening"),
  otherReservation("2026-09-19", "morning"),
  otherReservation("2026-09-19", "evening"),
  otherReservation("2026-09-22", "morning"),
  otherReservation("2026-09-22", "evening"),
  otherReservation("2026-09-23", "evening"),
  otherReservation("2026-09-24", "evening"),
  otherReservation("2026-09-25", "morning", "Maintenance"),
  otherReservation("2026-09-26", "morning"),
  otherReservation("2026-09-27", "morning"),
  otherReservation("2026-09-28", "morning", "Maintenance"),
  otherReservation("2026-09-28", "evening"),
  otherReservation("2026-09-29", "evening"),
  otherReservation("2026-09-30", "evening"),
  otherReservation("2026-10-02", "morning"),
  otherReservation("2026-10-06", "morning", "Maintenance"),
  otherReservation("2026-10-07", "evening"),
  otherReservation("2026-10-08", "evening"),
  otherReservation("2026-10-10", "morning"),
  otherReservation("2026-10-12", "morning"),
  otherReservation("2026-10-14", "morning", "Maintenance"),
  otherReservation("2026-10-15", "evening"),
  otherReservation("2026-10-17", "morning")
];
const specialSlots = [
  specialSlot("2026-07-10", "17:00", null, "Chris Lake Navy Pier Open Air"),
  specialSlot("2026-07-11", "17:00", null, "Chris Lake Navy Pier Open Air"),
  specialDate("2026-07-04", "Independence Day"),
  specialSlot("2026-07-09", "09:00", "16:00", "BLVCKSCENE"),
  specialSlot("2026-07-10", "09:00", "16:00", "BLVCKSCENE"),
  specialSlot("2026-07-11", "09:00", "16:00", "BLVCKSCENE"),
  specialSlot("2026-07-11", "09:00", "16:00", "Mac Race Start"),
  specialSlot("2026-07-12", "09:00", "16:00", "BLVCKSCENE"),
  specialSlot("2026-07-25", "09:00", "16:00", "Chicago Scene"),
  specialDate("2026-07-30", "Lollapalooza"),
  specialDate("2026-07-31", "Lollapalooza"),
  specialDate("2026-08-01", "Lollapalooza"),
  specialDate("2026-08-02", "Lollapalooza"),
  specialSlot("2026-08-14", "09:00", "16:00", "Air and Water Show Practice"),
  specialSlot("2026-08-15", "10:30", "15:00", "Air and Water Show"),
  specialSlot("2026-08-15", "17:00", null, "ZHU Navy Pier Open Air"),
  specialSlot("2026-08-16", "10:30", "15:00", "Air and Water Show"),
  ...navyPierFireworks()
];

function range(start, end) {
  return { start, end };
}

function slotRange(date, slotId) {
  return { start: date, end: date, block: "slot", slotId };
}

function boatReservation(date, slotId) {
  return { date, slotId };
}

function otherReservation(date, slotId, note = "") {
  return { date, slotId, note };
}

function slotDocumentId(date, slotId) {
  return `${date}_${slotId}`;
}

function slotDataFor(date, slotId) {
  return firebaseSlotState.byKey.get(slotDocumentId(date, slotId)) || null;
}

function rsvpSlotId(item) {
  return item.firebaseSlotId || slotDocumentId(item.date, item.slotId);
}

function summariesForSlot(item) {
  return rsvpState.summariesBySlotId.get(rsvpSlotId(item)) || [];
}

function rsvpCountForSlot(item) {
  const summaries = summariesForSlot(item);
  if (rsvpState.summariesLoaded || summaries.length) {
    return summaries.length;
  }
  const slotData = slotDataFor(item.date, item.slotId);
  return Number(slotData?.rsvpCount || 0);
}

function slotCapacity(item) {
  const slotData = slotDataFor(item.date, item.slotId);
  const capacity = Number(slotData?.capacity || 0);
  return Number.isFinite(capacity) && capacity > 0 ? capacity : 0;
}

function remainingCapacityForSlot(item) {
  const capacity = slotCapacity(item);
  if (!capacity) return null;
  return Math.max(capacity - rsvpCountForSlot(item), 0);
}

function slotCapacityLabel(item) {
  const capacity = slotCapacity(item);
  if (!capacity) return "";
  const reservedCount = rsvpCountForSlot(item);
  const remaining = Math.max(capacity - reservedCount, 0);
  return `${remaining}/${capacity} spots open`;
}

function slotCapacityChip(item) {
  const label = slotCapacityLabel(item);
  return label ? `<span class="chip chip--capacity">${escapeHtml(label)}</span>` : "";
}

function slotStatusLabel(item) {
  const slotData = slotDataFor(item.date, item.slotId);
  if (!slotData || !slotData.status) return "";
  if (slotData.status === "open") return "Open for RSVP";
  if (slotData.status === "other-reserved") return "Reserved by others";
  return String(slotData.status).replace(/-/g, " ");
}

async function loadFirebaseSlots() {
  try {
    const config = await import("./firebase-config.js");
    if (!config.hasFirebaseConfig()) {
      firebaseSlotState.configured = false;
      firebaseSlotState.loaded = false;
      return;
    }

    const api = await import("./firebase-client.js");
    const result = await api.loadPublicSlots();
    firebaseSlotState.configured = result.configured;
    firebaseSlotState.loaded = true;
    firebaseSlotState.error = "";
    applyFirebaseSlots(result.slots);
    await loadFirebaseSummaries(api);
    await loadFirebaseProfiles(api);
  } catch (error) {
    firebaseSlotState.error = error && error.message ? error.message : String(error);
    firebaseSlotState.loaded = false;
    console.error("Unable to load Firebase slots.", error);
  }
}

async function loadFirebaseProfiles(api) {
  try {
    const result = await api.loadRsvpProfiles();
    rsvpState.profilesLoaded = result.configured;
    rsvpState.profilesError = "";
    applyRsvpProfiles(result.profiles);
  } catch (error) {
    rsvpState.profilesLoaded = false;
    rsvpState.profilesError = error && error.message ? error.message : String(error);
    console.error("Unable to load RSVP profiles.", error);
  }
}

function applyRsvpProfiles(profiles) {
  rsvpState.profiles = profiles
    .map(normalizeRsvpProfile)
    .filter(Boolean)
    .filter((profile) => !isCanonicalCrewProfileDoc(profile))
    .sort((a, b) => a.name.localeCompare(b.name) || a.guestOf.localeCompare(b.guestOf));
}

function normalizeRsvpProfile(profile) {
  if (!profile || !profile.id || !profile.name || !profile.guestOf || !profile.contact) return null;
  return {
    id: String(profile.id),
    name: String(profile.name).trim(),
    guestOf: String(profile.guestOf).trim(),
    contact: String(profile.contact).trim()
  };
}

function isCanonicalCrewProfileDoc(profile) {
  return planner.people.some((person) => person.id === profile.id);
}

async function loadFirebaseSummaries(api) {
  try {
    const result = await api.loadAllPublicSummaries();
    rsvpState.summariesLoaded = result.configured;
    rsvpState.summariesError = "";
    applyRsvpSummaries(result.summaries);
  } catch (error) {
    rsvpState.summariesLoaded = false;
    rsvpState.summariesError = error && error.message ? error.message : String(error);
    console.error("Unable to load RSVP summaries.", error);
  }
}

function applyRsvpSummaries(summaries) {
  const bySlotId = new Map();
  for (const summary of summaries) {
    if (!summary || !summary.slotId) continue;
    const slotId = String(summary.slotId);
    if (!bySlotId.has(slotId)) bySlotId.set(slotId, []);
    bySlotId.get(slotId).push({
      id: summary.id || "",
      slotId,
      name: String(summary.name || "").trim(),
      guestOf: String(summary.guestOf || "").trim(),
      status: summary.status || "confirmed",
      createdAt: summary.createdAt || null
    });
  }
  rsvpState.summariesBySlotId = bySlotId;
}

function applyFirebaseSlots(firebaseSlots) {
  const normalized = firebaseSlots
    .map(normalizeFirebaseSlot)
    .filter(Boolean);

  if (!normalized.length) return;

  firebaseSlotState.byKey = new Map(normalized.map((item) => [slotDocumentId(item.date, item.slotId), item]));
  boatReservations = normalized
    .filter((item) => item.source === "boat")
    .map(firebaseSlotToReservation);
  otherReservations = normalized
    .filter((item) => item.source === "other")
    .map(firebaseSlotToReservation);
}

function normalizeFirebaseSlot(item) {
  if (!item || !item.date || !item.slotId) return null;
  return {
    firebaseSlotId: item.id || slotDocumentId(item.date, item.slotId),
    date: String(item.date),
    slotId: String(item.slotId),
    label: item.label || "",
    shortName: item.shortName || "",
    timeLabel: item.timeLabel || "",
    capacity: Number(item.capacity || 0),
    rsvpCount: Number(item.rsvpCount || 0),
    status: item.status || "open",
    source: item.source === "other" ? "other" : "boat",
    note: item.note || ""
  };
}

function firebaseSlotToReservation(item) {
  return {
    date: item.date,
    slotId: item.slotId,
    note: item.note,
    firebaseSlotId: item.firebaseSlotId
  };
}

function specialSlot(date, startTime, endTime, title) {
  return { date, startTime, endTime, title };
}

function specialDate(date, title) {
  return { date, title };
}

function holiday(date, title) {
  return { date, title };
}

function navyPierFireworks() {
  const shows = [];
  for (const date of eachDay("2026-05-23", "2026-09-05")) {
    const dateKey = toKey(date);
    const day = date.getDay();
    if (dateKey === "2026-07-04") continue;
    if (day === 3) {
      shows.push(specialSlot(dateKey, "21:00", "21:10", "Navy Pier Summer Fireworks"));
    }
    if (day === 6) {
      shows.push(specialSlot(dateKey, "22:00", "22:10", "Navy Pier Summer Fireworks"));
    }
  }
  shows.push(specialSlot("2026-07-04", "22:00", "22:15", "Navy Pier Independence Day Fireworks"));
  return shows;
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

function lastItem(items) {
  return items[items.length - 1];
}

function flatten(items) {
  return [].concat(...items);
}

function slotSequence(date, slot, length) {
  const startIndex = slots.indexOf(slot);
  if (startIndex === -1) return [];
  return Array.from({ length }, (_, index) => {
    const slotIndex = startIndex + index;
    return {
      date: addDays(date, Math.floor(slotIndex / slots.length)),
      slot: slots[slotIndex % slots.length]
    };
  });
}

function sequenceSlotDates(date, slot, length) {
  const seen = new Map();
  for (const item of slotSequence(date, slot, length)) {
    const dateKey = toKey(item.date);
    if (!seen.has(dateKey)) seen.set(dateKey, item.date);
  }
  return [...seen.values()];
}

function sequenceFitsRange(date, slot, length, end) {
  const sequence = slotSequence(date, slot, length);
  const last = lastItem(sequence);
  return Boolean(last) && last.date <= parseDate(end);
}

function slotWindow(date, slot, length) {
  const sequence = slotSequence(date, slot, length);
  const first = sequence[0];
  const last = lastItem(sequence);
  return {
    start: dateAtHour(first.date, first.slot.startHour),
    end: dateAtHour(addDays(last.date, last.slot.endOffsetDays), last.slot.endHour)
  };
}

function timedOverlap(date, slot, length, rangeItem) {
  const event = slotWindow(date, slot, length);
  const rangeStart = parseDate(rangeItem.start);
  const rangeEnd = addDays(parseDate(rangeItem.end), 1);
  return rangeStart < event.end && rangeEnd > event.start;
}

function allDayOverlap(date, slot, length, rangeItem) {
  return sequenceSlotDates(date, slot, length).some((slotDate) => {
    const dateKey = toKey(slotDate);
    return rangeItem.start <= dateKey && rangeItem.end >= dateKey;
  });
}

function blocksSlot(date, slot, length, rangeItem) {
  if (rangeItem.block === "slot") {
    const blockedSlot = slots.find((item) => item.id === rangeItem.slotId);
    if (!blockedSlot) return false;
    const event = slotWindow(date, slot, length);
    const blocked = slotWindow(parseDate(rangeItem.start), blockedSlot, 1);
    return event.start < blocked.end && blocked.start < event.end;
  }
  if (rangeItem.block === "timed") {
    return timedOverlap(date, slot, length, rangeItem);
  }
  return allDayOverlap(date, slot, length, rangeItem);
}

function selectedPeople() {
  return planner.people.filter((person, index) => {
    const input = els.peopleFilters.querySelector(`[data-person-index="${index}"]`);
    return input ? input.checked : true;
  });
}

function conflictsForSlot(date, slot, length, people = selectedPeople()) {
  return flatten(
    people.map((person) =>
      person.ranges
        .filter((item) => blocksSlot(date, slot, length, item))
        .map((item) => ({ person: crewKey(person), ...item }))
    )
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
        <span>${escapeHtml(crewKey(person))}</span>
        <input type="checkbox" data-person-index="${index}" checked>
      </label>
    `)
    .join("");
}

function candidateStarts(start, end, length) {
  if (length > 1) {
    start = maxDateKey(start, extendedWatersStart);
    end = minDateKey(end, extendedWatersEnd);
    if (parseDate(start) > parseDate(end)) return [];
  }
  return eachDay(start, end);
}

function maxDateKey(a, b) {
  return parseDate(a) >= parseDate(b) ? a : b;
}

function minDateKey(a, b) {
  return parseDate(a) <= parseDate(b) ? a : b;
}

function renderPlanner() {
  const selectedDate = selectedDateKey ? parseDate(selectedDateKey) : null;
  if (selectedDate && (selectedDate < parseDate(els.startDate.value) || selectedDate > parseDate(els.endDate.value))) {
    selectedDateKey = null;
  }

  updateDayFilterHints();
  const people = selectedPeople();
  const calendarPeople = planner.people;
  const length = Number(els.eventLength.value);
  const starts = candidateStarts(els.startDate.value, els.endDate.value, length);
  const candidates = buildDateCandidates(starts, people, calendarPeople, length, candidateEndDate(els.endDate.value, length));
  const dateResults = visibleDateResults(candidates);
  const searchResultSlots = els.showSearchOnCalendar.checked ? searchResultSlotKeys(dateResults.visible, length) : new Set();
  renderDateSearch(dateResults, calendarPeople.length, length);
  renderCalendar(calendarPeople, searchResultSlots);
  renderDateDetail(calendarPeople);
  renderSpecialSummary();
}

function candidateEndDate(end, length) {
  return length > 1 ? minDateKey(end, extendedWatersEnd) : end;
}

function buildDateCandidates(starts, requiredPeople, displayPeople, length, end) {
  return flatten(
    starts.map((date) =>
      flatten(slots.map((slot) => {
      if (!sequenceFitsRange(date, slot, length, end) || isReservedCandidate(date, slot, length)) return [];
      const requiredConflicts = conflictsForSlot(date, slot, length, requiredPeople);
      if (requiredConflicts.length) return [];
      const conflicts = conflictsForSlot(date, slot, length, displayPeople);
      const specials = specialSlotsForWindow(date, slot, length);
      const isWeekend = isWeekendSlot(date, slot, length);
      const isHoliday = holidaysForWindow(date, slot, length).length > 0;
      const isSaturdayTwo = isSaturdayTwoSlot(date, slot, length);
      return {
        date,
        slot,
        conflicts,
        indicators: pickIndicators(date, slot, length),
        isWeekend,
        isHoliday,
        isSaturdayTwo,
        specials,
        climate: averageClimateForWindow(date, slot, length),
        reservedGapDays: nearestBoatReservationGap(date),
        score: scoreFor(conflicts, displayPeople.length),
        ootCount: uniqueConflicts(conflicts).length
      };
    }))
    )
  );
}

function isReservedCandidate(date, slot, length) {
  const event = slotWindow(date, slot, length);
  const blockingReservations = length > 1 ? otherReservations : [...boatReservations, ...otherReservations];
  return blockingReservations.some((item) => {
    const reservedSlot = slots.find((candidate) => candidate.id === item.slotId);
    if (!reservedSlot) return false;
    const reserved = slotWindow(parseDate(item.date), reservedSlot, 1);
    return event.start < reserved.end && reserved.start < event.end;
  });
}

function defaultCandidateSort(a, b) {
  return (
    b.score - a.score ||
    a.ootCount - b.ootCount ||
    a.date - b.date ||
    slots.indexOf(a.slot) - slots.indexOf(b.slot)
  );
}

function nearestBoatReservationGap(date) {
  if (!boatReservations.length) return Infinity;
  const candidateDate = parseDate(toKey(date));
  return Math.min(...boatReservations.map((item) => Math.abs(daysBetween(candidateDate, parseDate(item.date)))));
}

function daysBetween(a, b) {
  return Math.round((a - b) / (24 * 60 * 60 * 1000));
}

function visibleDateResults(candidates) {
  const filtered = filterDateCandidates(candidates);
  filtered.sort(candidateSortFor(els.sortDates.value));
  const requestedLimit = Number(els.topMatches.value);
  const limit = els.topMatches.value === "" || !Number.isFinite(requestedLimit) || requestedLimit <= 0 ? filtered.length : requestedLimit;
  const visible = filtered.slice(0, limit);
  return { filtered, visible };
}

function searchResultSlotKeys(results, length) {
  return new Set(
    flatten(
      results.map((result) =>
        slotSequence(result.date, result.slot, length).map((item) => `${toKey(item.date)}|${item.slot.id}`)
      )
    )
  );
}

function renderDateSearch(results, peopleCount, length) {
  const { filtered, visible } = results;
  els.dateResultCount.textContent = `${visible.length} of ${filtered.length} ${filtered.length === 1 ? "match" : "matches"}`;
  els.dateResults.innerHTML = visible.length
    ? visible.map((pick) => dateCandidateMarkup(pick, peopleCount, length)).join("")
    : `
      <div class="date-results__empty">
        <strong>No matching dates</strong>
        <span>Loosen the filters or expand the date range.</span>
      </div>
    `;
}

function filterDateCandidates(candidates) {
  const minTemp = els.minTemp.value === "" ? null : Number(els.minTemp.value);
  const dayType = els.dayTypeFilter.value;
  const specialFilter = els.specialFilter.value;
  const selectedDays = checkedValues(els.dayFilters);
  const selectedMonths = checkedValues(els.monthFilters);
  const selectedSlots = checkedValues(els.slotFilters);

  return candidates.filter((item) => {
    const temp = item.climate ? item.climate.average : null;
    if (minTemp !== null && (temp === null || temp < minTemp)) return false;
    if (!selectedDays.has(String(item.date.getDay()))) return false;
    if (!selectedMonths.has(String(item.date.getMonth() + 1))) return false;
    if (!selectedSlots.has(item.slot.id)) return false;
    if (dayType === "weekend" && !item.isWeekend && !item.isHoliday) return false;
    if (dayType === "saturday-two" && !item.isSaturdayTwo) return false;
    if (dayType === "weekday" && item.isWeekend) return false;
    if (specialFilter === "with" && !item.specials.length) return false;
    if (specialFilter === "without" && item.specials.length) return false;
    return true;
  });
}

function checkedValues(inputs) {
  return new Set([...inputs].filter((input) => input.checked).map((input) => input.value));
}

function updateDayFilterHints() {
  const dayType = els.dayTypeFilter.value;
  els.dayFilters.forEach((input) => {
    const day = Number(input.value);
    const isWeekendSearchDay = day === 0 || day === 5 || day === 6;
    const hasHoliday = holidays.some((item) => parseDate(item.date).getDay() === day);
    const isDimmed =
      (dayType === "weekend" && !isWeekendSearchDay && !hasHoliday) ||
      (dayType === "weekday" && (day === 0 || day === 6)) ||
      (dayType === "saturday-two" && day !== 0);
    input.parentElement.toggleAttribute("data-muted", isDimmed);
  });
}

function candidateSortFor(sortKey) {
  const fallback = defaultCandidateSort;
  return (a, b) => {
    switch (sortKey) {
      case "temp-warm":
        return climateSortValue(b) - climateSortValue(a) || fallback(a, b);
      case "temp-cool":
        return climateSortValue(a) - climateSortValue(b) || fallback(a, b);
      case "date-early":
        return a.date - b.date || slots.indexOf(a.slot) - slots.indexOf(b.slot) || fallback(a, b);
      case "special-first":
        return Number(Boolean(b.specials.length)) - Number(Boolean(a.specials.length)) || fallback(a, b);
      case "weekend-first":
        return Number(b.isWeekend) - Number(a.isWeekend) || fallback(a, b);
      case "reserved-gap":
        return b.reservedGapDays - a.reservedGapDays || fallback(a, b);
      case "oot-low":
      default:
        return a.ootCount - b.ootCount || fallback(a, b);
    }
  };
}

function climateSortValue(item) {
  return item.climate ? item.climate.average : -Infinity;
}

function dateCandidateMarkup(pick, peopleCount, length) {
  const conflicts = uniqueConflicts(pick.conflicts);
  const level = levelFor(pick.conflicts);
  const className = level === 3 ? "is-bad" : level === 2 ? "is-captain" : level === 1 ? "is-warn" : "";
  const label = dateLabel(pick.date, pick.slot, length);
  const indicators = [...pick.indicators];
  if (pick.isSaturdayTwo) {
    indicators.push({ type: "saturday-two", label: "Sat 2.0", title: "Sunday slot before a holiday" });
  }
  return `
    <article class="date-result ${className}">
      <div class="date-result__head">
        <div>
          <strong class="date-result__date">${label}</strong>
          <span class="date-result__slot">Starts ${pick.slot.name} &middot; ${pick.slot.timeLabel} &middot; ${length} ${length === 1 ? "slot" : "slots"}</span>
        </div>
        <button class="ghost-button date-result__select" type="button" data-date-jump="${toKey(pick.date)}">View</button>
      </div>
      <div class="date-result__meta">
        ${averageClimateMarkup(pick.climate)}
        <span class="metric">${pick.ootCount} OOT</span>
        <span class="metric">${pick.reservedGapDays}d reserved gap</span>
        <span class="metric">${pick.isWeekend ? "Weekend" : "Weekday"}</span>
      </div>
      ${indicatorMarkup(indicators.filter((indicator) => indicator.type !== "weekend"))}
      ${specialsMarkup(pick.specials)}
      <span class="date-result__score">${pick.score}/${peopleCount} available</span>
      <div class="conflicts">
        ${conflicts.length ? conflicts.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("") : `<span class="chip chip--clear">No conflicts</span>`}
      </div>
    </article>
  `;
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

function dateLabel(date, slot, length) {
  if (length === 1) return `${weekday.format(date)}, ${compactDate.format(date)}`;
  const sequence = slotSequence(date, slot, length);
  const last = lastItem(sequence);
  if (toKey(last.date) === toKey(date)) return `${weekday.format(date)}, ${compactDate.format(date)}`;
  return `${compactDate.format(date)}-${compactDate.format(last.date)}`;
}

function slotIndicators(date, slot, length = 1) {
  const indicators = [];
  if (isWeekendSlot(date, slot, length)) {
    indicators.push({ type: "weekend", label: "Wknd", title: "Weekend slot" });
  }

  return indicators;
}

function pickIndicators(date, slot, length = 1) {
  const indicators = slotIndicators(date, slot, length);
  const holidayNames = holidaysForWindow(date, slot, length);
  if (holidayNames.length) {
    indicators.push({ type: "holiday", label: "Hol", title: holidayNames.join(", ") });
  }

  return indicators;
}

function isWeekendSlot(date, slot, length = 1) {
  const event = slotWindow(date, slot, length);
  for (let day = new Date(event.start); day < event.end; day = addDays(day, 1)) {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = addDays(dayStart, 1);
    const dayOfWeek = dayStart.getDay();
    if (dayOfWeek === 6 || dayOfWeek === 0) return true;
    if (dayOfWeek === 5 && event.end > dateAtHour(dayStart, 17) && event.start < dayEnd) return true;
  }
  return false;
}

function isSaturdayTwoSlot(date, slot, length = 1) {
  return length === 1 && date.getDay() === 0 && holidayLookup.has(toKey(addDays(date, 1)));
}

function holidaysForWindow(date, slot = slots[0], length = 1) {
  if (typeof slot === "number") {
    length = slot;
    slot = slots[0];
  }
  return sequenceSlotDates(date, slot, length)
    .map((slotDate) => toKey(slotDate))
    .map((dateKey) => holidayLookup.get(dateKey))
    .filter(Boolean);
}

function climateForDate(date) {
  const month = climateNormals[date.getMonth() + 1];
  const item = month ? month[date.getDate() - 1] : null;
  if (!item) return null;
  return { average: item[0], precipitation: item[1] };
}

function climateLabel(date) {
  const climate = climateForDate(date);
  if (!climate) return "";
  return `${formatNumber(climate.average)}F avg - ${climate.precipitation.toFixed(2)} in precip`;
}

function climateShortLabel(date) {
  const climate = climateForDate(date);
  if (!climate) return "";
  return `${Math.round(climate.average)}F`;
}

function averageClimateForWindow(date, slot, length) {
  const climates = sequenceSlotDates(date, slot, length).map(climateForDate).filter(Boolean);
  if (!climates.length) return null;
  return {
    average: climates.reduce((total, item) => total + item.average, 0) / climates.length,
    precipitation: climates.reduce((total, item) => total + item.precipitation, 0) / climates.length
  };
}

function climateMarkup(date) {
  const label = climateLabel(date);
  if (!label) return "";
  return `<span class="climate-chip" title="Chicago normal weather from NWS, 1991-2020">${escapeHtml(label)}</span>`;
}

function averageClimateMarkup(climate) {
  if (!climate) return "";
  const label = `${formatNumber(climate.average)}F avg`;
  const title = `${formatNumber(climate.average)}F average temp - ${climate.precipitation.toFixed(2)} in average daily precip`;
  return `<span class="climate-chip" title="${escapeHtml(title)}">${escapeHtml(label)}</span>`;
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function indicatorMarkup(indicators) {
  if (!indicators.length) return "";
  return `
    <span class="indicators" aria-label="${escapeHtml(indicators.map((item) => item.title).join(", "))}">
      ${indicators.map((item) => `<span class="indicator indicator--${item.type}" title="${escapeHtml(item.title)}">${item.label}</span>`).join("")}
    </span>
  `;
}

function specialSlotsForDate(date) {
  const dateKey = typeof date === "string" ? date : toKey(date);
  return specialSlots.filter((item) => item.date === dateKey);
}

function specialSlotsForWindow(date, slot, length) {
  const event = slotWindow(date, slot, length);
  const startKey = toKey(event.start);
  const endKey = toKey(event.end);
  return specialSlots.filter((item) => {
    if (item.date < startKey || item.date > endKey) return false;
    const window = specialWindow(item);
    if (!window) return true;
    return window.start < event.end && window.end > event.start;
  });
}

function boatReservationsForDate(date) {
  const dateKey = typeof date === "string" ? date : toKey(date);
  return boatReservations.filter((item) => item.date === dateKey);
}

function otherReservationsForDate(date) {
  const dateKey = typeof date === "string" ? date : toKey(date);
  return otherReservations.filter((item) => item.date === dateKey);
}

function specialWindow(item) {
  if (!item.startTime) return null;
  const date = parseDate(item.date);
  const start = dateAtTime(date, item.startTime);
  const end = item.endTime ? dateAtTime(date, item.endTime) : new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

function specialOverlapsSlot(date, slot, item) {
  const event = specialWindow(item);
  if (!event) return false;
  const slotEvent = slotWindow(date, slot, 1);
  return event.start < slotEvent.end && event.end > slotEvent.start;
}

function specialSlotIdsForDate(date, specials) {
  return new Set(
    flatten(
      specials.map((item) =>
        slots
          .filter((slot) => specialOverlapsSlot(date, slot, item))
          .map((slot) => slot.id)
      )
    )
  );
}

function timeLabel(value) {
  const { hour, minute } = parseTime(value);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function specialTimeLabel(item) {
  if (!item.startTime) return "All Day";
  if (!item.endTime) return timeLabel(item.startTime);
  return `${timeLabel(item.startTime)}-${timeLabel(item.endTime)}`;
}

function specialsMarkup(specials) {
  if (!specials.length) return "";
  return `
    <div class="date-result__specials">
      ${specials.map((item) => `<span title="${escapeHtml(specialTimeLabel(item))}">${escapeHtml(item.title)}</span>`).join("")}
    </div>
  `;
}

function renderSpecialSummary() {
  const grouped = specialSlots.reduce((groups, item) => {
    if (!groups.has(item.title)) {
      groups.set(item.title, []);
    }
    groups.get(item.title).push(item);
    return groups;
  }, new Map());

  els.specialSummary.innerHTML = `
    <div class="special-summary__head">
      <p class="eyebrow">Special Dates</p>
      <strong>${specialSlots.length} slots</strong>
    </div>
    <div class="special-summary__list">
      ${[...grouped.entries()].map(specialGroupMarkup).join("")}
    </div>
  `;
}

function renderBoatReserved(people) {
  const sorted = [...boatReservations].sort((a, b) => a.date.localeCompare(b.date) || slotOrder(a.slotId) - slotOrder(b.slotId));

  els.boatReserved.innerHTML = `
    <div class="section-head">
      <div>
        <p class="eyebrow">Boat Reserved</p>
        <h2>Drafted slots</h2>
      </div>
      <span class="result-count">${sorted.length} ${sorted.length === 1 ? "slot" : "slots"}</span>
    </div>
    <div class="boat-reserved__grid">
      ${sorted.map((item) => boatReservedMarkup(item, people)).join("")}
    </div>
  `;
}

function slotOrder(slotId) {
  const index = slots.findIndex((item) => item.id === slotId);
  return index === -1 ? slots.length : index;
}

function boatReservedMarkup(item, people) {
  const date = parseDate(item.date);
  const slot = slots.find((candidate) => candidate.id === item.slotId);
  if (!slot) return "";

  const conflicts = uniqueConflicts(conflictsForSlot(date, slot, 1, people));
  const unavailable = new Set(conflicts);
  const available = people.map(crewKey).filter((name) => !unavailable.has(name));
  const specials = specialSlotsForWindow(date, slot, 1);

  return `
    <article class="boat-reserved__card">
      <div class="boat-reserved__head">
        <div>
          <strong>${fullDate.format(date)}</strong>
          <span>${slot.name} &middot; ${slot.timeLabel}</span>
        </div>
        <span>${available.length}/${people.length} available</span>
      </div>
      <div class="boat-reserved__block">
        <strong>Special events</strong>
        <div class="boat-reserved__chips">
          ${specials.length ? specials.map((special) => `<span class="special-summary__chip" title="${escapeHtml(specialTimeLabel(special))}">${escapeHtml(special.title)}</span>`).join("") : `<span class="chip chip--clear">None listed</span>`}
        </div>
      </div>
      <div class="boat-reserved__block">
        <strong>RSVP capacity</strong>
        <div class="boat-reserved__chips">
          ${slotCapacityChip(item) || `<span class="chip chip--clear">Capacity pending</span>`}
        </div>
      </div>
      <div class="boat-reserved__block">
        <strong>Not OOT</strong>
        <div class="boat-reserved__chips">
          ${available.length ? available.map((name) => `<span class="chip chip--clear">${escapeHtml(name)}</span>`).join("") : `<span class="chip">No selected people available</span>`}
        </div>
      </div>
    </article>
  `;
}

function reservedDayGroups() {
  const groups = new Map();
  for (const reservation of boatReservations) {
    if (!groups.has(reservation.date)) groups.set(reservation.date, []);
    groups.get(reservation.date).push(reservation);
  }

  return [...groups.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, reservations]) => ({
      date,
      reservations: reservations.sort((a, b) => slotOrder(a.slotId) - slotOrder(b.slotId))
    }));
}

function reservedDayGroupsForReservations(reservations) {
  const groups = new Map();
  for (const reservation of reservations) {
    if (!groups.has(reservation.date)) groups.set(reservation.date, []);
    groups.get(reservation.date).push(reservation);
  }

  return [...groups.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, groupReservations]) => ({
      date,
      reservations: groupReservations.sort((a, b) => slotOrder(a.slotId) - slotOrder(b.slotId))
    }));
}

function reservedProfileBuckets() {
  const going = [];
  const notRsvped = [];

  for (const reservation of boatReservations) {
    if (selectedProfileIsGoing(reservation)) {
      going.push(reservation);
    } else {
      notRsvped.push(reservation);
    }
  }

  return { going, notRsvped };
}

function reservedProfileBucketMarkup(title, reservations, emptyLabel) {
  return `
    <section class="reserved-detail-group" aria-label="${escapeHtml(title)}">
      <div class="section-head section-head--subtle">
        <div>
          <p class="eyebrow">${escapeHtml(title)}</p>
          <h3>${reservations.length} ${reservations.length === 1 ? "slot" : "slots"}</h3>
        </div>
      </div>
      ${reservations.length
        ? reservedDayGroupsForReservations(reservations).map(reservedDayMarkup).join("")
        : `<span class="chip chip--clear">${escapeHtml(emptyLabel)}</span>`}
    </section>
  `;
}

function reservedDetailListMarkup() {
  if (!selectedRsvpProfile()) {
    return reservedDayGroups().map(reservedDayMarkup).join("");
  }

  const buckets = reservedProfileBuckets();
  return [
    reservedProfileBucketMarkup("Going", buckets.going, "This profile is not going on any reserved slots yet"),
    reservedProfileBucketMarkup("Not RSVPed", buckets.notRsvped, "This profile is going on every reserved slot")
  ].join("");
}

function reservedDayMarkup(group) {
  const date = parseDate(group.date);
  const holidayNames = holidaysForWindow(date, 1);

  return `
    <article class="reserved-day-group">
      <div class="reserved-day-group__head">
        <div>
          <strong>${fullDateWithYear.format(date)}</strong>
          ${holidayNames.length ? `<span>${escapeHtml(holidayNames.join(", "))}</span>` : ""}
          ${climateMarkup(date)}
        </div>
        <span>${group.reservations.length} ${group.reservations.length === 1 ? "slot" : "slots"}</span>
      </div>
      <div class="reserved-slot-table" role="table" aria-label="Reserved slots for ${fullDateWithYear.format(date)}">
        <div class="reserved-slot-row reserved-slot-row--head" role="row">
          <span>Slot</span>
          <span>Time</span>
          <span>OOT</span>
          <span>RSVP</span>
          <span>Going</span>
          <span>Special events</span>
        </div>
        ${group.reservations.map((item) => reservedSlotDetailMarkup(date, item)).join("")}
      </div>
    </article>
  `;
}

function reservedSlotDetailMarkup(date, item) {
  const slot = slots.find((candidate) => candidate.id === item.slotId);
  if (!slot) return "";

  const conflicts = uniqueConflicts(conflictsForSlot(date, slot, 1, planner.people));
  const specials = specialSlotsForWindow(date, slot, 1);
  const slotData = slotDataFor(item.date, item.slotId);
  const isOpen = slotData?.status === "open";
  const remaining = remainingCapacityForSlot(item);
  const hasCapacity = remaining === null || remaining > 0;
  const hasSelectedProfile = Boolean(selectedRsvpProfile());
  const selectedProfileAlreadyGoing = selectedProfileIsGoing(item);
  const buttonLabel = !hasSelectedProfile ? "Select profile" : selectedProfileAlreadyGoing ? "Going" : isOpen && hasCapacity ? "RSVP" : "Full";
  const buttonDisabled = !hasSelectedProfile || selectedProfileAlreadyGoing || !isOpen || !hasCapacity || !firebaseSlotState.configured;

  return `
    <div class="reserved-slot-row" role="row">
      <span data-label="Slot"><strong>${escapeHtml(slot.name)}</strong></span>
      <span data-label="Time">${escapeHtml(slot.timeLabel)}</span>
      <div class="reserved-slot-row__chips" data-label="OOT">
        ${conflicts.length ? conflicts.map((name) => `<span class="chip">${escapeHtml(name)}</span>`).join("") : `<span class="chip chip--clear">No one OOT</span>`}
      </div>
      <div class="reserved-slot-row__chips" data-label="RSVP">
        ${slotCapacityChip(item) || `<span class="chip chip--clear">Capacity pending</span>`}
        <button class="rsvp-button" type="button" data-rsvp-date="${escapeHtml(item.date)}" data-rsvp-slot="${escapeHtml(item.slotId)}"${buttonDisabled ? " disabled" : ""}>${buttonLabel}</button>
      </div>
      <div class="reserved-slot-row__chips" data-label="Going">
        ${rsvpSummaryChips(item)}
      </div>
      <div class="reserved-slot-row__chips" data-label="Special events">
        ${specials.length ? specials.map((special) => `<span class="special-summary__chip" title="${escapeHtml(specialTimeLabel(special))}">${escapeHtml(special.title)}</span>`).join("") : `<span class="chip chip--clear">None listed</span>`}
      </div>
    </div>
  `;
}

function rsvpSummaryChips(item) {
  const summaries = summariesForSlot(item).filter((summary) => summary.name);
  if (summaries.length) {
    return summaries
      .map((summary) => {
        const guestOfLabel = guestOfDisplayLabel(summary.guestOf);
        const canRemove = selectedProfileOwnsSummary(summary);
        return `
          <span class="rsvp-chip">
            <span>${escapeHtml(summary.name)} <small>${escapeHtml(guestOfLabel)}</small></span>
            ${canRemove ? `<button type="button" data-rsvp-remove="${escapeHtml(summary.id)}" data-rsvp-date="${escapeHtml(item.date)}" data-rsvp-slot="${escapeHtml(item.slotId)}" aria-label="Remove ${escapeHtml(summary.name)}">Remove</button>` : ""}
          </span>
        `;
      })
      .join("");
  }
  if (rsvpState.summariesError) return `<span class="chip">RSVPs unavailable</span>`;
  return `<span class="chip chip--clear">No RSVPs yet</span>`;
}

function crewOptionsMarkup(selectedName = "", options = {}) {
  const choices = options.includeBoatCrew === false
    ? crewGuestOfOptions()
    : [
        { value: crewGuestOfNone, label: "Boat crew" },
        ...crewGuestOfOptions()
      ];
  return `
    <option value="">Select crew member</option>
    ${choices.map((option) => `<option value="${escapeHtml(option.value)}"${option.value === selectedName ? " selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
  `;
}

function editableProfileGuestOfOptionsMarkup(selectedName = "") {
  return crewOptionsMarkup(selectedName, { includeBoatCrew: selectedName === crewGuestOfNone });
}

function profileOptionsMarkup(selectedProfileId = "") {
  const profiles = allRsvpProfiles();
  return `
    <option value="">Create new profile</option>
    ${profiles.map((profile) => `
      <option value="${escapeHtml(profile.id)}"${profile.id === selectedProfileId ? " selected" : ""}>
        ${escapeHtml(profile.name)} - ${escapeHtml(guestOfDisplayLabel(profile.guestOf))}
      </option>
    `).join("")}
  `;
}

function profileById(profileId) {
  return allRsvpProfiles().find((profile) => profile.id === profileId) || null;
}

function selectedRsvpProfile() {
  return profileById(rsvpState.selectedProfileId);
}

function selectedProfileOwnsSummary(summary) {
  const profile = selectedRsvpProfile();
  if (!profile || !summary) return false;

  const seededCrewId = seededCrewIdFromRsvpId(summary.id);
  if (seededCrewId) {
    return profile.sourceId === seededCrewId || profile.id === crewProfileId(seededCrewId);
  }

  return profile.name === summary.name && profile.guestOf === summary.guestOf;
}

function selectedProfileIsGoing(reservation) {
  return summariesForSlot(reservation).some(selectedProfileOwnsSummary);
}

function seededCrewIdFromRsvpId(rsvpId) {
  const value = String(rsvpId || "");
  if (!value.startsWith(seededCrewRsvpIdPrefix)) return "";
  const match = value.match(/^crew_going_(.+)_\d{4}-\d{2}-\d{2}_[a-z-]+$/);
  return match ? match[1] : "";
}

function profileFormValues(form) {
  return {
    name: form.elements.name.value.trim(),
    guestOf: form.elements.guestOf.value,
    contact: form.elements.contact.value.trim()
  };
}

function setFormFromProfile(form, profile) {
  form.elements.name.value = profile.name;
  form.elements.guestOf.value = profile.guestOf;
  form.elements.contact.value = profile.contact;
}

function formControl(form, name) {
  return form?.elements?.namedItem(name) || form?.elements?.[name] || null;
}

function upsertLocalProfile(profile) {
  const normalized = normalizeRsvpProfile(profile);
  if (!normalized || isCanonicalCrewProfileDoc(normalized)) return;
  const index = rsvpState.profiles.findIndex((item) => item.id === normalized.id);
  if (index === -1) {
    rsvpState.profiles = [...rsvpState.profiles, normalized];
  } else {
    rsvpState.profiles = rsvpState.profiles.map((item) => item.id === normalized.id ? normalized : item);
  }
  rsvpState.profiles.sort((a, b) => a.name.localeCompare(b.name) || a.guestOf.localeCompare(b.guestOf));
}

function ensureRsvpDialog() {
  if (document.querySelector("#rsvpDialog")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <div class="rsvp-dialog" id="rsvpDialog" hidden>
      <div class="rsvp-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="rsvpDialogTitle">
        <div class="rsvp-dialog__head">
          <div>
            <p class="eyebrow">RSVP</p>
            <h2 id="rsvpDialogTitle">Reserve your spot</h2>
            <span id="rsvpDialogSlot"></span>
          </div>
          <button class="ghost-button rsvp-dialog__close" type="button" data-rsvp-close aria-label="Close RSVP form">Close</button>
        </div>
        <form class="rsvp-form" id="rsvpForm" novalidate>
          <input type="hidden" name="date">
          <input type="hidden" name="slotId">
          <div class="field-row">
            <label for="rsvpName">Name</label>
            <input id="rsvpName" name="name" type="text" autocomplete="name" required maxlength="100" readonly>
          </div>
          <div class="field-row">
            <label for="rsvpGuestOf">Guest of</label>
            <select id="rsvpGuestOf" name="guestOf" required disabled>
              ${crewOptionsMarkup()}
            </select>
          </div>
          <div class="field-row">
            <label for="rsvpContact">Phone number</label>
            <input id="rsvpContact" name="contact" type="tel" autocomplete="tel" required maxlength="40" readonly>
          </div>
          <p class="rsvp-form__message" id="rsvpMessage" aria-live="polite"></p>
          <div class="rsvp-form__actions">
            <button class="ghost-button" type="button" data-rsvp-close>Cancel</button>
            <button type="submit">Confirm RSVP</button>
          </div>
        </form>
      </div>
    </div>
  `);
}

function openRsvpDialog(date, slotId) {
  ensureRsvpDialog();
  const reservation = boatReservations.find((item) => item.date === date && item.slotId === slotId);
  if (!reservation) return;
  const selectedProfile = selectedRsvpProfile();
  if (!selectedProfile) {
    document.querySelector("#rsvpProfilesSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const slot = slots.find((candidate) => candidate.id === slotId);
  const dialog = document.querySelector("#rsvpDialog");
  const form = document.querySelector("#rsvpForm");
  const slotLabel = document.querySelector("#rsvpDialogSlot");
  const message = document.querySelector("#rsvpMessage");
  form.reset();
  form.elements.date.value = date;
  form.elements.slotId.value = slotId;
  form.elements.guestOf.innerHTML = crewOptionsMarkup();
  setFormFromProfile(form, selectedProfile);
  form.querySelector("[type='submit']").disabled = false;
  slotLabel.textContent = `${fullDateWithYear.format(parseDate(date))} - ${slot ? `${slot.name} - ${slot.timeLabel}` : slotId}`;
  message.textContent = rsvpState.message || "";
  dialog.hidden = false;
  form.querySelector("[type='submit']").focus();
}

function closeRsvpDialog() {
  const dialog = document.querySelector("#rsvpDialog");
  if (dialog) dialog.hidden = true;
  rsvpState.activeSlot = null;
  rsvpState.message = "";
}

function summaryForReservation(reservation, summaryId) {
  return summariesForSlot(reservation).find((summary) => summary.id === summaryId) || null;
}

function renderProfileSection() {
  if (!els.reservedOnlyList) return;
  const existing = document.querySelector("#rsvpProfilesSection");
  const section = existing || document.createElement("section");
  const profiles = allRsvpProfiles();
  section.className = "profile-section";
  section.id = "rsvpProfilesSection";
  section.setAttribute("aria-labelledby", "rsvpProfilesTitle");
  section.innerHTML = `
    <div class="section-head">
      <div>
        <p class="eyebrow">Profiles</p>
        <h2 id="rsvpProfilesTitle">RSVP profiles</h2>
      </div>
      <span class="result-count">${profiles.length} ${profiles.length === 1 ? "profile" : "profiles"}</span>
    </div>
    <form class="profile-form" id="rsvpProfileForm" novalidate>
      <input type="hidden" name="profileId">
      <div class="field-row field-row--wide">
        <label for="profileSelector">Select your profile</label>
        <select id="profileSelector" name="selectedProfile">${profileOptionsMarkup(rsvpState.selectedProfileId)}</select>
      </div>
      <div class="field-row">
        <label for="profileName">Name</label>
        <input id="profileName" name="name" type="text" autocomplete="name" required maxlength="100">
      </div>
      <div class="field-row">
        <label for="profileGuestOf">Guest of</label>
        <select id="profileGuestOf" name="guestOf" required>${editableProfileGuestOfOptionsMarkup()}</select>
      </div>
      <div class="field-row">
        <label for="profileContact">Phone number</label>
        <input id="profileContact" name="contact" type="tel" autocomplete="tel" required maxlength="40">
      </div>
      <p class="rsvp-form__message" id="rsvpProfileMessage" aria-live="polite">${rsvpState.profilesError ? "Custom profiles unavailable." : ""}</p>
      <div class="rsvp-form__actions">
        <button type="submit">Save profile</button>
      </div>
    </form>
  `;

  if (!existing) {
    document.querySelector(".reserved-page")?.prepend(section);
  }
  section.querySelector("#rsvpProfileForm")?.addEventListener("submit", submitProfileForm);
}

function resetProfileForm() {
  const form = document.querySelector("#rsvpProfileForm");
  if (!form) return;
  form.reset();
  form.elements.profileId.value = "";
  rsvpState.selectedProfileId = "";
  formControl(form, "selectedProfile").innerHTML = profileOptionsMarkup();
  form.elements.guestOf.innerHTML = editableProfileGuestOfOptionsMarkup();
  setProfileFormReadOnly(form, false);
  document.querySelector("#rsvpProfileMessage").textContent = "";
}

function fillProfileForm(profile) {
  const form = document.querySelector("#rsvpProfileForm");
  if (!form || !profile) return;
  formControl(form, "selectedProfile").innerHTML = profileOptionsMarkup(profile.id);
  if (profile.readOnly) {
    form.elements.profileId.value = "";
    form.elements.name.value = profile.name;
    form.elements.guestOf.innerHTML = crewOptionsMarkup(profile.guestOf);
    form.elements.contact.value = profile.contact;
    setProfileFormReadOnly(form, true);
    document.querySelector("#rsvpProfileMessage").textContent = "Crew profiles are built in and cannot be edited.";
    return;
  }
  form.elements.profileId.value = profile.id;
  form.elements.name.value = profile.name;
  form.elements.guestOf.innerHTML = editableProfileGuestOfOptionsMarkup(profile.guestOf);
  form.elements.contact.value = profile.contact;
  setProfileFormReadOnly(form, false);
  document.querySelector("#rsvpProfileMessage").textContent = "";
}

function setProfileFormReadOnly(form, readOnly) {
  form.elements.name.disabled = readOnly;
  form.elements.guestOf.disabled = readOnly;
  form.elements.contact.disabled = readOnly;
  form.querySelector("[type='submit']").disabled = readOnly;
}

async function saveProfileFromValues(values, profileId = "") {
  const existingProfile = profileById(profileId);
  if (existingProfile?.readOnly) {
    throw new Error("Crew profiles cannot be edited.");
  }
  const api = await import("./firebase-client.js");
  if (profileId) {
    await api.updateRsvpProfile(profileId, values);
    upsertLocalProfile({ id: profileId, ...values });
    return profileId;
  }
  const newProfileId = await api.createRsvpProfile(values);
  upsertLocalProfile({ id: newProfileId, ...values });
  return newProfileId;
}

async function submitProfileForm(event) {
  event.preventDefault();
  if (rsvpState.submitting) return;

  const form = event.currentTarget;
  const message = document.querySelector("#rsvpProfileMessage");
  const values = profileFormValues(form);
  if (!values.name || !values.guestOf || !values.contact) {
    message.textContent = "Add name, guest of, and phone number.";
    return;
  }

  rsvpState.submitting = true;
  message.textContent = "Saving profile...";
  try {
    const profileId = await saveProfileFromValues(values, form.elements.profileId.value);
    rsvpState.selectedProfileId = profileId;
    renderProfileSection();
    renderReservedOnlyPage();
    fillProfileForm(profileById(profileId));
    document.querySelector("#rsvpProfileMessage").textContent = "Profile saved.";
  } catch (error) {
    message.textContent = error && error.message ? error.message : "Unable to save profile.";
  } finally {
    rsvpState.submitting = false;
  }
}

function removeLocalSummary(reservation, summaryId) {
  const slotId = rsvpSlotId(reservation);
  const summaries = rsvpState.summariesBySlotId.get(slotId) || [];
  rsvpState.summariesBySlotId.set(slotId, summaries.filter((summary) => summary.id !== summaryId));
}

async function removeRsvpSummary(date, slotId, summaryId) {
  if (rsvpState.submitting) return;
  const reservation = boatReservations.find((item) => item.date === date && item.slotId === slotId);
  const summary = reservation ? summaryForReservation(reservation, summaryId) : null;
  if (!reservation || !summary) return;
  if (!selectedProfileOwnsSummary(summary)) {
    window.alert(`Select ${summary.name}'s profile before removing them from Going.`);
    return;
  }
  if (!window.confirm(`Remove ${summary.name} from this RSVP?`)) return;

  rsvpState.submitting = true;
  try {
    const api = await import("./firebase-client.js");
    await api.deletePublicRsvp(summaryId);
    removeLocalSummary(reservation, summaryId);
    renderReservedOnlyPage();
  } catch (error) {
    window.alert(error && error.message ? error.message : "Unable to remove RSVP.");
  } finally {
    rsvpState.submitting = false;
  }
}

function addOptimisticSummary(reservation, values, summaryId) {
  const slotId = rsvpSlotId(reservation);
  const summaries = rsvpState.summariesBySlotId.get(slotId) || [];
  rsvpState.summariesBySlotId.set(slotId, [
    ...summaries,
    {
      id: summaryId || `local-${Date.now()}`,
      slotId,
      name: values.name,
      guestOf: values.guestOf,
      status: "confirmed",
      createdAt: new Date()
    }
  ]);
  rsvpState.summariesLoaded = true;
}

async function submitRsvpForm(event) {
  event.preventDefault();
  if (rsvpState.submitting) return;

  const form = event.currentTarget;
  const message = document.querySelector("#rsvpMessage");
  const date = form.elements.date.value;
  const slotId = form.elements.slotId.value;
  const reservation = boatReservations.find((item) => item.date === date && item.slotId === slotId);
  if (!reservation) {
    message.textContent = "This slot is no longer available.";
    return;
  }

  const remaining = remainingCapacityForSlot(reservation);
  const values = {
    slotId: rsvpSlotId(reservation),
    name: form.elements.name.value.trim(),
    guestOf: form.elements.guestOf.value,
    contact: form.elements.contact.value.trim()
  };

  if (!values.name || !values.guestOf || !values.contact) {
    message.textContent = "Add your name, guest of, and phone number.";
    return;
  }
  if (remaining !== null && remaining < 1) {
    message.textContent = "This slot is full.";
    return;
  }

  rsvpState.submitting = true;
  message.textContent = "Saving RSVP...";
  try {
    const api = await import("./firebase-client.js");
    const rsvpId = await api.createRsvp(values);
    addOptimisticSummary(reservation, values, rsvpId);
    rsvpState.message = "RSVP confirmed.";
    renderReservedOnlyPage();
    openRsvpDialog(date, slotId);
    document.querySelector("#rsvpMessage").textContent = "RSVP confirmed.";
    form.querySelector("[type='submit']").disabled = true;
  } catch (error) {
    message.textContent = error && error.message ? error.message : "Unable to save RSVP.";
  } finally {
    rsvpState.submitting = false;
  }
}

function slotName(slotId) {
  const slot = slots.find((candidate) => candidate.id === slotId);
  return slot ? slot.name : slotId;
}

function specialGroupMarkup([title, items]) {
  const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || ""));
  return `
    <article class="special-summary__item">
      <strong>${escapeHtml(title)}</strong>
      <div>
        ${sorted.map((item) => `<span class="special-summary__chip">${escapeHtml(specialSummaryDateLabel(item))}</span>`).join("")}
      </div>
    </article>
  `;
}

function specialSummaryDateLabel(item) {
  const date = compactDate.format(parseDate(item.date));
  return `${date}, ${specialTimeLabel(item)}`;
}

function renderCalendar(people, searchResultSlots = new Set()) {
  const months = [];
  const start = parseDate(els.startDate.value);
  const end = parseDate(els.endDate.value);
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    months.push(new Date(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  els.calendar.innerHTML = months.map((month) => monthMarkup(month, people, start, end, searchResultSlots)).join("");
}

function renderReservedOnlyPage() {
  const start = parseDate(defaultStartDate);
  const end = parseDate(defaultEndDate);
  const months = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= end) {
    months.push(new Date(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  renderReservedOnlyDateDetail();
  els.reservedOnlyCalendar.innerHTML = months.map((month) => reservedOnlyMonthMarkup(month, start, end)).join("");
  els.reservedOnlyList.innerHTML = reservedDetailListMarkup();
}

function reservedOnlyMonthMarkup(month, start, end) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const visibleStart = start > first ? start : first;
  const visibleEnd = end < last ? end : last;
  const blanks = Array.from({ length: visibleStart.getDay() }, () => `<div class="day is-outside"></div>`);
  const days = eachDay(toKey(visibleStart), toKey(visibleEnd)).map((date) => {
    const dateKey = toKey(date);
    const reservations = boatReservationsForDate(dateKey);
    const holidayNames = reservations.length ? holidaysForWindow(date, 1) : [];
    const specials = specialsForReservations(date, reservations);
    const reservedSlotIds = new Set(reservations.map((item) => item.slotId));
    const fullyBoatReserved = slots.every((slot) => reservedSlotIds.has(slot.id));
    const title = reservations.length
      ? `${fullDateWithYear.format(date)}: ${reservations.map((item) => slotName(item.slotId)).join(", ")} reserved`
      : fullDateWithYear.format(date);

    return `
      <button class="day" data-date="${dateKey}" data-level="0" data-special-date="false" data-boat-reserved="${reservations.length > 0}" data-fully-reserved="${fullyBoatReserved}" data-fully-boat-reserved="${fullyBoatReserved}" aria-pressed="${dateKey === selectedDateKey}" title="${escapeHtml(title)}">
        <span class="day__head">
          <strong>${date.getDate()}</strong>
        </span>
        ${reservedDaySpecialIconsMarkup(holidayNames, specials)}
        <span class="slot-list">
          ${reservedOnlySlotSummaryMarkup(reservations)}
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

function renderReservedOnlyDateDetail() {
  if (!els.reservedOnlyDateDetail) return;

  if (!selectedDateKey) {
    els.reservedOnlyDateDetail.innerHTML = `
      <div class="date-detail__empty">
        <strong>Select a date</strong>
        <span>Click any calendar day to see reservation details.</span>
      </div>
    `;
    return;
  }

  const date = parseDate(selectedDateKey);
  const reservations = boatReservationsForDate(selectedDateKey).sort((a, b) => slotOrder(a.slotId) - slotOrder(b.slotId));
  const holidayNames = reservations.length ? holidaysForWindow(date, 1) : [];
  const specials = specialsForReservations(date, reservations);

  els.reservedOnlyDateDetail.innerHTML = `
    <div class="date-detail__head">
      <div>
        <p class="eyebrow">Selected Date</p>
        <h3>${fullDate.format(date)}</h3>
        ${selectedDateHolidayMarkup(holidayNames)}
        ${climateMarkup(date)}
      </div>
      <span class="date-detail__count">${reservations.length ? `${reservations.length} ${reservations.length === 1 ? "slot" : "slots"}` : "Not reserved"}</span>
    </div>
    ${specials.length ? `
      <div class="date-detail__specials">
        <strong>Special events for our slot${reservations.length === 1 ? "" : "s"}</strong>
        ${specials.map(specialDetailMarkup).join("")}
      </div>
    ` : ""}
    ${reservations.length ? reservedSelectedSlotsMarkup(date, reservations) : `
      <div class="date-detail__summary">
        <span class="chip chip--clear">No boat reservation for this day</span>
      </div>
    `}
  `;
}

function reservedSelectedSlotsMarkup(date, reservations) {
  return `
    <div class="reserved-slot-table reserved-slot-table--selected" role="table" aria-label="Reserved slots for ${fullDateWithYear.format(date)}">
      <div class="reserved-slot-row reserved-slot-row--head" role="row">
        <span>Slot</span>
        <span>Time</span>
        <span>OOT</span>
        <span>RSVP</span>
        <span>Going</span>
        <span>Special events</span>
      </div>
      ${reservations.map((item) => reservedSlotDetailMarkup(date, item)).join("")}
    </div>
  `;
}

function reservedDaySpecialIconsMarkup(holidayNames, specials) {
  const icons = uniqueReservedSpecialIcons([
    ...holidayNames.map((title) => ({ type: "holiday", label: "", title })),
    ...specials.map(specialIcon)
  ]);
  if (!icons.length) return `<span class="reserved-special-icons"></span>`;

  return `
    <span class="reserved-special-icons" aria-label="${escapeHtml(icons.map((item) => item.title).join(", "))}">
      ${icons.map(reservedSpecialIconMarkup).join("")}
    </span>
  `;
}

function reservedSpecialIconMarkup(item) {
  const image = item.src
    ? `<img src="${escapeHtml(item.src)}" alt="" aria-hidden="true">`
    : escapeHtml(item.label);
  return `<i class="reserved-special-icon reserved-special-icon--${item.type}" title="${escapeHtml(item.title)}">${image}</i>`;
}

function uniqueReservedSpecialIcons(icons) {
  const seen = new Set();
  return icons.filter((item) => {
    const key = `${item.type}:${item.title.split(":")[0].replace(/ observed$/i, "").toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function specialsForReservations(date, reservations) {
  if (!reservations.length) return [];
  const reservedSlots = reservations
    .map((reservation) => slots.find((slot) => slot.id === reservation.slotId))
    .filter(Boolean);

  return specialSlotsForDate(date).filter((item) => {
    if (isHolidaySpecial(item)) return false;
    if (!item.startTime) return true;
    return reservedSlots.some((slot) => specialOverlapsSlot(date, slot, item));
  });
}

function isHolidaySpecial(item) {
  const holidayTitle = holidayLookup.get(item.date);
  if (!holidayTitle) return false;
  const specialTitle = item.title.toLowerCase();
  return holidayTitle.toLowerCase().replace(/ observed$/, "") === specialTitle;
}

function specialIcon(item) {
  const title = item.title.toLowerCase();
  if (title.includes("fireworks")) return { type: "fireworks", label: "", src: "assets/icons8-firework-explosion-100.png", title: `${item.title}: ${specialTimeLabel(item)}` };
  if (title.includes("chris lake")) return { type: "disco", label: "", src: "assets/icons8-disco-100.png", title: `${item.title}: ${specialTimeLabel(item)}` };
  if (title.includes("chicago scene") || title.includes("blvckscene")) return { type: "anchor", label: "", src: "assets/icons8-anchor-90.png", title: `${item.title}: ${specialTimeLabel(item)}` };
  return { type: "special", label: "", title: `${item.title}: ${specialTimeLabel(item)}` };
}

function reservedOnlySlotSummaryMarkup(reservations) {
  return reservations.map((reservation) => {
    const slot = slots.find((candidate) => candidate.id === reservation.slotId);
    if (!slot) return "";

    return `
      <span class="slot-pill" data-level="reserved" data-special-slot="false" data-reserved-slot="true" data-other-reserved-slot="false" data-search-result-slot="false" title="${escapeHtml(slotName(reservation.slotId))} reserved">
        <span class="slot-pill__text">${escapeHtml(slot.shortName)}</span>
      </span>
    `;
  }).join("");
}

function monthMarkup(month, people, start, end, searchResultSlots) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const visibleStart = start > first ? start : first;
  const visibleEnd = end < last ? end : last;
  const blanks = Array.from({ length: visibleStart.getDay() }, () => `<div class="day is-outside"></div>`);
  const days = eachDay(toKey(visibleStart), toKey(visibleEnd)).map((date) => {
    const dateKey = toKey(date);
    const holidayNames = holidaysForWindow(date, 1);
    const climate = climateShortLabel(date);
    const specials = specialSlotsForDate(dateKey);
    const reservations = boatReservationsForDate(dateKey);
    const otherReservedSlots = otherReservationsForDate(dateKey);
    const specialSlotIds = specialSlotIdsForDate(date, specials);
    const reservedSlotIds = new Set(reservations.map((item) => item.slotId));
    const otherReservedSlotIds = new Set(otherReservedSlots.map((item) => item.slotId));
    const hasAllDaySpecial = specials.some((item) => !item.startTime);
    const specialOnDate = hasAllDaySpecial || (specials.length > 0 && specialSlotIds.size === 0);
    const daySlots = slots.map((slot) => {
      const conflicts = conflictsForSlot(date, slot, 1, people);
      return {
        slot,
        conflicts,
        level: levelFor(conflicts),
        names: [...new Set(conflicts.map((item) => item.person.split(" ")[0]))],
        indicators: slotIndicators(date, slot, 1),
        isSpecial: specialSlotIds.has(slot.id),
        isReserved: reservedSlotIds.has(slot.id),
        isOtherReserved: otherReservedSlotIds.has(slot.id),
        isSearchResult: searchResultSlots.has(`${dateKey}|${slot.id}`)
      };
    });
    const fullyBoatReserved = daySlots.every((item) => item.isReserved);
    const fullyReserved = daySlots.every((item) => item.isReserved || item.isOtherReserved);
    const level = fullyReserved ? "reserved" : Math.max(...daySlots.map((item) => item.level));
    const ootCount = uniqueConflicts(flatten(daySlots.map((item) => item.conflicts))).length;
    return `
      <button class="day" data-date="${dateKey}" data-level="${level}" data-special-date="${fullyReserved ? false : specialOnDate}" data-fully-reserved="${fullyReserved}" data-fully-boat-reserved="${fullyBoatReserved}" aria-pressed="${dateKey === selectedDateKey}" title="${dayTooltipFor(date, daySlots, people.length, specials)}">
        <span class="day__head">
          <strong>${date.getDate()}</strong>
          ${ootCount ? `<span class="day__oot-count">${ootCount} OOT</span>` : ""}
        </span>
        ${dayMetaMarkup(climate, holidayNames)}
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

function dayIndicatorMarkup(holidayNames) {
  if (!holidayNames.length) return "";
  return `
    <span class="day-indicators" aria-label="${escapeHtml(holidayNames.join(", "))}">
      <i class="day-indicator day-indicator--holiday" title="${escapeHtml(holidayNames.join(", "))}"></i>
    </span>
  `;
}

function dayMetaMarkup(climate, holidayNames) {
  if (!climate && !holidayNames.length) return "";
  return `
    <span class="day__meta">
      ${climate ? `<span class="day__climate">${escapeHtml(climate)}</span>` : "<span></span>"}
      ${dayIndicatorMarkup(holidayNames)}
      <span></span>
    </span>
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
    conflicts: conflictsForSlot(date, slot, 1, people),
    indicators: slotIndicators(date, slot, 1)
  }));
  const allConflicts = uniqueConflicts(flatten(daySlots.map((item) => item.conflicts)));
  const specials = specialSlotsForDate(selectedDateKey);
  const reservations = [
    ...boatReservationsForDate(selectedDateKey).map((item) => ({ ...item, type: "boat" })),
    ...otherReservationsForDate(selectedDateKey).map((item) => ({ ...item, type: "other" }))
  ].sort((a, b) => slotOrder(a.slotId) - slotOrder(b.slotId));
  const holidayNames = holidaysForWindow(date, 1);

  els.dateDetail.innerHTML = `
    <div class="date-detail__head">
      <div>
        <p class="eyebrow">Selected Date</p>
        <h3>${fullDate.format(date)}</h3>
        ${selectedDateHolidayMarkup(holidayNames)}
        ${climateMarkup(date)}
      </div>
      <span class="date-detail__count">${allConflicts.length ? `${allConflicts.length} OOT` : "All clear"}</span>
    </div>
    <div class="date-detail__summary">
      ${allConflicts.length ? allConflicts.map((name) => `<span class="chip">${escapeHtml(name)}</span>`).join("") : `<span class="chip chip--clear">No one OOT</span>`}
    </div>
    ${reservations.length ? selectedDateReservationsMarkup(reservations) : ""}
    ${specials.length ? `
      <div class="date-detail__specials">
        <strong>Special slots</strong>
        ${specials.map(specialDetailMarkup).join("")}
      </div>
    ` : ""}
    <div class="date-detail__slots">
      ${ootDetailMarkup(daySlots, people.length)}
    </div>
  `;
}

function selectedDateReservationsMarkup(reservations) {
  return `
    <div class="date-detail__reservations">
      <strong>Reservations</strong>
      ${reservations.map(reservationDetailMarkup).join("")}
    </div>
  `;
}

function reservationDetailMarkup(item) {
  const slot = slots.find((candidate) => candidate.id === item.slotId);
  const slotName = slot ? slot.name : item.slotId;
  const slotTime = slot ? slot.timeLabel : "";
  const typeLabel = item.type === "boat" ? "Boat reserved" : "Reserved by others";
  const note = item.note ? ` - ${item.note}` : "";
  const capacityLabel = slotCapacityLabel(item);
  const statusLabel = slotStatusLabel(item);

  return `
    <article class="reservation-detail reservation-detail--${item.type}">
      <span>${escapeHtml(slotName)}${slotTime ? ` &middot; ${escapeHtml(slotTime)}` : ""}</span>
      <strong>${escapeHtml(typeLabel + note)}</strong>
      ${capacityLabel || statusLabel ? `<span>${escapeHtml([capacityLabel, statusLabel].filter(Boolean).join(" - "))}</span>` : ""}
    </article>
  `;
}

function selectedDateHolidayMarkup(holidayNames) {
  if (!holidayNames.length) return "";
  return `
    <div class="selected-holidays" aria-label="${escapeHtml(holidayNames.join(", "))}">
      ${holidayNames.map((name) => `<span class="indicator indicator--holiday">${escapeHtml(name)}</span>`).join("")}
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
        ${indicatorMarkup(item.indicators)}
      </div>
      <div class="slot-detail__people">
        ${conflicts.length ? conflicts.map((name) => `<span class="chip">${escapeHtml(name)}</span>`).join("") : `<span class="chip chip--clear">${peopleCount}/${peopleCount} available</span>`}
      </div>
    </section>
  `;
}

function slotMarkup(item) {
  const title = item.isOtherReserved
    ? "Reserved by another group"
    : item.isReserved
    ? "Boat reserved"
    : item.indicators.map((indicator) => indicator.title).join(", ");
  const titleWithSearch = [item.isSearchResult ? "In Date Search results" : "", title].filter(Boolean).join("; ");
  const marks = !item.isReserved && !item.isOtherReserved && item.indicators.length
    ? `<span class="slot-pill__marks">${item.indicators.map((indicator) => `<i data-type="${indicator.type}">${indicator.label[0]}</i>`).join("")}</span>`
    : "";
  const level = item.isOtherReserved ? "other-reserved" : item.isReserved ? "reserved" : item.level;
  const isSpecial = item.isOtherReserved ? false : item.isSpecial;
  return `
    <span class="slot-pill" data-level="${level}" data-special-slot="${isSpecial}" data-reserved-slot="${item.isReserved}" data-other-reserved-slot="${item.isOtherReserved}" data-search-result-slot="${item.isSearchResult}" title="${escapeHtml(titleWithSearch)}">
      <span class="slot-pill__text">${item.slot.shortName}</span>
      ${marks}
    </span>
  `;
}

function specialDetailMarkup(item) {
  return `
    <article class="special-detail">
      <span>${escapeHtml(specialTimeLabel(item))}</span>
      <strong>${escapeHtml(item.title)}</strong>
    </article>
  `;
}

function dayTooltipFor(date, daySlots, peopleCount, specials = []) {
  const details = daySlots.map((item) => {
    const conflicts = uniqueConflicts(item.conflicts);
    const availability = `${peopleCount - conflicts.length}/${peopleCount} available`;
    const status = conflicts.length ? conflicts.join(", ") : "clear";
    const indicators = item.indicators.length ? `; ${item.indicators.map((indicator) => indicator.title).join(", ")}` : "";
    return `${item.slot.name} (${item.slot.timeLabel}): ${availability}; ${status}${indicators}`;
  });
  const specialDetails = specials.map((item) => `${specialTimeLabel(item)} ${item.title}`);
  const climate = climateLabel(date);
  return `${compactDate.format(date)}: ${climate ? `${climate} | ` : ""}${details.join(" | ")}${specialDetails.length ? ` | Specials: ${specialDetails.join("; ")}` : ""}`;
}

function renderSource() {
  sortPeople();
  els.sourceGrid.innerHTML = planner.people
    .map(sourceCardMarkup)
    .join("");
}

function sourceCardMarkup(person) {
  const ranges = sourceRangesInDefaultRange(person);
  return `
    <article class="source-card">
      <div class="source-card__head">
        <h3>${escapeHtml(crewKey(person))}</h3>
        <span>${ootDayCount(person)} OOT days</span>
      </div>
      <ul>
        ${ranges.length ? ranges.map((item) => `<li>${escapeHtml(sourceRangeLabel(item))}</li>`).join("") : "<li>No OOT dates in default range</li>"}
      </ul>
    </article>
  `;
}

function ootDayCount(person) {
  const days = new Set();
  for (const item of sourceRangesInDefaultRange(person)) {
    for (const day of eachDay(item.start, item.end)) {
      days.add(toKey(day));
    }
  }
  return days.size;
}

function sourceRangesInDefaultRange(person) {
  return person.ranges.map(clipRangeToDefaultRange).filter(Boolean);
}

function clipRangeToDefaultRange(item) {
  const defaultStart = els.startDate ? els.startDate.defaultValue : defaultStartDate;
  const defaultEnd = els.endDate ? els.endDate.defaultValue : defaultEndDate;
  const start = parseDate(item.start) < parseDate(defaultStart) ? defaultStart : item.start;
  const end = parseDate(item.end) > parseDate(defaultEnd) ? defaultEnd : item.end;
  if (parseDate(start) > parseDate(end)) return null;
  return { ...item, start, end };
}

function loadPlanner() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (Array.isArray(saved)) {
      planner.people = saved.map(normalizePerson);
    }
  } catch {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Storage can be unavailable on local file pages; keep the built-in data.
    }
  }
  defaultPeople.forEach(ensurePersonRanges);
  sortPeople();
}

function sortPeople() {
  planner.people.sort((a, b) => {
    const aCaptainIndex = captainOrder.indexOf(crewKey(a));
    const bCaptainIndex = captainOrder.indexOf(crewKey(b));
    if (aCaptainIndex !== -1 || bCaptainIndex !== -1) {
      if (aCaptainIndex === -1) return 1;
      if (bCaptainIndex === -1) return -1;
      return aCaptainIndex - bCaptainIndex;
    }
    return crewKey(a).localeCompare(crewKey(b));
  });
}

function ensurePersonRanges(defaultPerson) {
  const existing = planner.people.find((person) => crewKey(person).toLowerCase() === crewKey(defaultPerson).toLowerCase());
  if (!existing) {
    planner.people.push(normalizePerson(defaultPerson));
    return;
  }

  existing.name = defaultPerson.name;
  existing.id = defaultPerson.id;
  existing.shortName = defaultPerson.shortName;
  existing.contact = defaultPerson.contact;
  for (const defaultRange of defaultPerson.ranges) {
    const hasRange = existing.ranges.some(
      (item) =>
        item.start === defaultRange.start &&
        item.end === defaultRange.end &&
        item.block === defaultRange.block &&
        item.slotId === defaultRange.slotId
    );
    if (!hasRange) {
      existing.ranges.push(normalizeRange(defaultRange));
    }
  }
}

function normalizePerson(person) {
  const name = String(person?.name || "Unnamed").trim() || "Unnamed";
  const shortName = String(person?.shortName || firstName(name)).trim() || firstName(name);
  return {
    id: String(person?.id || slugify(name)).trim(),
    name,
    shortName,
    contact: String(person?.contact || "").trim(),
    ranges: Array.isArray(person?.ranges) ? person.ranges.map(normalizeRange).filter(Boolean) : []
  };
}

function firstName(name) {
  return String(name || "Unnamed").trim().split(/\s+/)[0] || "Unnamed";
}

function crewKey(person) {
  return String(person?.shortName || firstName(person?.name)).trim() || "Unnamed";
}

function crewDisplayName(person) {
  return String(person?.name || crewKey(person)).trim() || crewKey(person);
}

function crewGuestOfOptions() {
  return planner.people.map((person) => ({
    value: crewKey(person),
    label: crewDisplayName(person)
  }));
}

function crewRsvpProfiles() {
  return planner.people
    .filter((person) => person.id && person.contact)
    .map((person) => ({
      id: person.id,
      name: crewDisplayName(person),
      guestOf: crewGuestOfNone,
      contact: person.contact
    }));
}

function builtInCrewProfiles() {
  return crewRsvpProfiles().map((profile) => ({
    ...profile,
    id: crewProfileId(profile.id),
    sourceId: profile.id,
    readOnly: true
  }));
}

function editableRsvpProfiles() {
  return rsvpState.profiles.map((profile) => ({
    ...profile,
    readOnly: false
  }));
}

function allRsvpProfiles() {
  return [
    ...builtInCrewProfiles(),
    ...editableRsvpProfiles()
  ].sort((a, b) => {
    if (a.readOnly !== b.readOnly) return a.readOnly ? -1 : 1;
    return a.name.localeCompare(b.name) || a.guestOf.localeCompare(b.guestOf);
  });
}

function crewProfileId(id) {
  return `${crewProfileIdPrefix}${id}`;
}

function guestOfDisplayLabel(guestOf) {
  if (guestOf === crewGuestOfNone) return "Boat crew";
  return guestOf ? `Guest of ${guestOf}` : "Guest of crew";
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeRange(item) {
  if (!item || !item.start || !item.end) return null;
  const start = String(item.start);
  const end = String(item.end);
  const sorted = parseDate(start) <= parseDate(end) ? [start, end] : [end, start];
  return {
    start: sorted[0],
    end: sorted[1],
    block: item.block,
    slotId: item.slotId
  };
}

function dateRangeLabel(start, end) {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (start === end) return compactDate.format(startDate);
  return `${compactDate.format(startDate)}-${compactDate.format(endDate)}`;
}

function sourceRangeLabel(item) {
  const label = dateRangeLabel(item.start, item.end);
  if (item.block === "slot" && item.slotId === "evening") return `${label} PM`;
  return label;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function boot() {
  loadPlanner();
  await loadFirebaseSlots();

  if (els.reservedOnlyCalendar && els.reservedOnlyList) {
    renderSource();
    renderReservedOnlyPage();
    renderProfileSection();
    ensureRsvpDialog();
    els.reservedOnlyCalendar.addEventListener("click", (event) => {
      const day = event.target.closest(".day[data-date]");
      if (!day) return;
      selectedDateKey = day.dataset.date;
      renderReservedOnlyPage();
      els.reservedOnlyDateDetail?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.addEventListener("click", (event) => {
      const closeButton = event.target.closest("[data-rsvp-close]");
      if (closeButton) {
        closeRsvpDialog();
        return;
      }
      const removeButton = event.target.closest("[data-rsvp-remove]");
      if (removeButton) {
        removeRsvpSummary(removeButton.dataset.rsvpDate, removeButton.dataset.rsvpSlot, removeButton.dataset.rsvpRemove);
        return;
      }
      const rsvpButton = event.target.closest("[data-rsvp-date][data-rsvp-slot]");
      if (!rsvpButton || rsvpButton.disabled) return;
      openRsvpDialog(rsvpButton.dataset.rsvpDate, rsvpButton.dataset.rsvpSlot);
    });
    document.querySelector("#rsvpForm")?.addEventListener("submit", submitRsvpForm);
    document.addEventListener("input", (event) => {
      if (!event.target.matches("#profileSelector")) return;
      const profile = profileById(event.target.value);
      rsvpState.selectedProfileId = event.target.value;
      if (profile) {
        fillProfileForm(profile);
      } else {
        resetProfileForm();
      }
      renderReservedOnlyPage();
    });
    return;
  }

  renderFilters();
  els.peopleFilters.addEventListener("change", renderPlanner);
  els.calendar.addEventListener("click", (event) => {
    const day = event.target.closest(".day[data-date]");
    if (!day) return;
    selectedDateKey = day.dataset.date;
    renderPlanner();
  });
  els.dateResults.addEventListener("click", (event) => {
    const button = event.target.closest("[data-date-jump]");
    if (!button) return;
    selectedDateKey = button.dataset.dateJump;
    renderPlanner();
    els.dateDetail.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  [
    els.startDate,
    els.endDate,
    els.eventLength,
    els.sortDates,
    els.dayTypeFilter,
    els.specialFilter,
    els.minTemp,
    els.topMatches,
    els.showSearchOnCalendar,
    ...els.dayFilters,
    ...els.monthFilters,
    ...els.slotFilters
  ].forEach((el) => {
    el.addEventListener("input", renderPlanner);
  });
  renderPlanner();
}

boot();
