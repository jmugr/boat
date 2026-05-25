const fs = require("fs");
const path = require("path");
const vm = require("vm");
const admin = require("firebase-admin");

const root = path.resolve(__dirname, "..");
const appJsPath = path.join(root, "app.js");
const appJs = fs.readFileSync(appJsPath, "utf8").replace(/\nboot\(\);\s*$/, `
globalThis.__seedData = {
  crewRsvpProfiles: crewRsvpProfiles()
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

const { crewRsvpProfiles } = sandbox.__seedData;
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;

if (!projectId) {
  console.error("Set FIREBASE_PROJECT_ID before running seed:profiles.");
  process.exit(1);
}

admin.initializeApp({ projectId });
const db = admin.firestore();

async function seed() {
  let batch = db.batch();
  let count = 0;

  for (const profile of crewRsvpProfiles) {
    const ref = db.collection("rsvpProfiles").doc(profile.id);
    const snapshot = await ref.get();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const doc = {
      name: profile.name,
      guestOf: profile.guestOf,
      contact: profile.contact,
      updatedAt: timestamp
    };

    if (!snapshot.exists) {
      doc.createdAt = timestamp;
    }

    batch.set(ref, doc, { merge: true });
    count += 1;

    if (count % 400 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  await batch.commit();
  console.log(`Seeded ${count} RSVP profile documents into ${projectId}.`);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
