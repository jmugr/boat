const fs = require("fs");
const path = require("path");
const vm = require("vm");
const admin = require("firebase-admin");

const root = path.resolve(__dirname, "..");
const appJsPath = path.join(root, "app.js");
const appJs = fs.readFileSync(appJsPath, "utf8").replace(/\nboot\(\);\s*$/, `
globalThis.__seedData = {
  slots,
  boatReservations,
  otherReservations
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

const { slots, boatReservations, otherReservations } = sandbox.__seedData;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;

if (!projectId) {
  console.error("Set FIREBASE_PROJECT_ID before running seed:firebase.");
  process.exit(1);
}

admin.initializeApp({ projectId });
const db = admin.firestore();

function slotDocumentId(date, slotId) {
  return `${date}_${slotId}`;
}

function slotMetadata(slotId) {
  return slots.find((slot) => slot.id === slotId) || { id: slotId, name: slotId, shortName: slotId, timeLabel: "" };
}

function slotDoc(reservation, source) {
  const metadata = slotMetadata(reservation.slotId);
  return {
    date: reservation.date,
    slotId: reservation.slotId,
    label: metadata.name,
    shortName: metadata.shortName,
    timeLabel: metadata.timeLabel,
    capacity: Number(process.env.DEFAULT_SLOT_CAPACITY || 12),
    status: source === "boat" ? "open" : "other-reserved",
    source,
    note: reservation.note || "",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

async function seed() {
  const reservations = [
    ...boatReservations.map((reservation) => slotDoc(reservation, "boat")),
    ...otherReservations.map((reservation) => slotDoc(reservation, "other"))
  ];

  let batch = db.batch();
  let count = 0;

  for (const reservation of reservations) {
    const ref = db.collection("slots").doc(slotDocumentId(reservation.date, reservation.slotId));
    batch.set(ref, reservation, { merge: true });
    count += 1;

    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  await batch.commit();
  console.log(`Seeded ${count} slot documents into ${projectId}.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
