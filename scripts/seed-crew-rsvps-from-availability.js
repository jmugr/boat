const fs = require("fs");
const path = require("path");
const vm = require("vm");
const admin = require("firebase-admin");

const root = path.resolve(__dirname, "..");
const appJsPath = path.join(root, "app.js");
const appJs = fs.readFileSync(appJsPath, "utf8").replace(/\nboot\(\);\s*$/, `
globalThis.__seedData = {
  planner,
  slots,
  boatReservations,
  blocksSlot,
  parseDate,
  slotDocumentId
};
`);

const noopElement = {
  addEventListener() {},
  querySelector() {
    return noopElement;
  },
  querySelectorAll() {
    return [];
  }
};

const sandbox = {
  console,
  Intl,
  Date,
  Map,
  Set,
  Array,
  Number,
  String,
  Boolean,
  Math,
  JSON,
  localStorage: {
    getItem() {
      return null;
    },
    removeItem() {}
  },
  document: {
    querySelector() {
      return noopElement;
    },
    querySelectorAll() {
      return [];
    }
  }
};

vm.createContext(sandbox);
vm.runInContext(appJs, sandbox, { filename: appJsPath });

const {
  planner,
  slots,
  boatReservations,
  blocksSlot,
  parseDate,
  slotDocumentId
} = sandbox.__seedData;

const dryRun = process.argv.includes("--dry-run");
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
const seededIdPrefix = "crew_going_";
const ignoredCrewIds = new Set(["jerry-hand"]);

function shouldSeedCrewRsvp(person) {
  return person.id && !ignoredCrewIds.has(person.id);
}

function crewIsOotForReservation(person, reservation) {
  const slot = slots.find((item) => item.id === reservation.slotId);
  if (!slot) return false;
  return person.ranges.some((range) => blocksSlot(parseDate(reservation.date), slot, 1, range));
}

function crewRsvpDocumentId(person, reservation) {
  return `${seededIdPrefix}${person.id}_${reservation.date}_${reservation.slotId}`;
}

function crewRsvpForReservation(person, reservation) {
  return {
    id: crewRsvpDocumentId(person, reservation),
    slotId: slotDocumentId(reservation.date, reservation.slotId),
    name: person.name,
    guestOf: "N/A",
    contact: person.contact,
    status: "confirmed",
    date: reservation.date,
    slot: reservation.slotId
  };
}

function buildSeedPlan() {
  const included = planner.people.filter(shouldSeedCrewRsvp);
  const skipped = planner.people.filter((person) => !shouldSeedCrewRsvp(person));
  const records = [];
  const skippedOot = [];

  for (const person of included) {
    for (const reservation of boatReservations) {
      if (crewIsOotForReservation(person, reservation)) {
        skippedOot.push({
          person: person.name,
          date: reservation.date,
          slot: reservation.slotId
        });
        continue;
      }
      records.push(crewRsvpForReservation(person, reservation));
    }
  }

  return { records, skipped, skippedOot };
}

function groupCounts(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key];
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function printPlan(plan) {
  console.log(`${dryRun ? "Dry run: would seed" : "Seeding"} ${plan.records.length} crew RSVP documents.`);
  console.log(`Skipping crew: ${plan.skipped.map((person) => person.name).join(", ") || "none"}.`);
  console.log(`OOT exclusions: ${plan.skippedOot.length}.`);
  console.log("Going by person:");
  console.log(JSON.stringify(groupCounts(plan.records, "name"), null, 2));
  console.log("OOT skipped by person:");
  console.log(JSON.stringify(groupCounts(plan.skippedOot, "person"), null, 2));
  console.log("Seed records:");
  console.log(JSON.stringify(plan.records, null, 2));
}

async function setSeedDoc(batch, collectionName, record) {
  const ref = db.collection(collectionName).doc(record.id);
  const snapshot = await ref.get();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  const doc = collectionName === "rsvps"
    ? {
        slotId: record.slotId,
        name: record.name,
        guestOf: record.guestOf,
        contact: record.contact,
        status: record.status
      }
    : {
        slotId: record.slotId,
        name: record.name,
        guestOf: record.guestOf,
        status: record.status
      };

  if (!snapshot.exists) {
    doc.createdAt = timestamp;
  }

  batch.set(ref, doc, { merge: true });
}

async function seed(plan) {
  let batch = db.batch();
  let writes = 0;

  for (const record of plan.records) {
    await setSeedDoc(batch, "rsvps", record);
    await setSeedDoc(batch, "rsvpSummaries", record);
    writes += 2;

    if (writes >= 400) {
      await batch.commit();
      batch = db.batch();
      writes = 0;
    }
  }

  if (writes > 0) {
    await batch.commit();
  }

  console.log(`Seeded ${plan.records.length} crew RSVP records into ${projectId}.`);
}

const plan = buildSeedPlan();
printPlan(plan);

if (dryRun) {
  process.exit(0);
}

if (!projectId) {
  console.error("Set FIREBASE_PROJECT_ID before running seed:rsvps:crew.");
  process.exit(1);
}

admin.initializeApp({ projectId });
const db = admin.firestore();

seed(plan).catch((error) => {
  console.error(error);
  process.exit(1);
});
