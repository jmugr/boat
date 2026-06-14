const fs = require("fs");
const path = require("path");
const vm = require("vm");
const admin = require("firebase-admin");

const dryRun = process.argv.includes("--dry-run");
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
const seededIdPrefix = "crew_going_";

if (!projectId) {
  console.error("Set FIREBASE_PROJECT_ID before running this script.");
  process.exit(1);
}

admin.initializeApp({ projectId });
const db = admin.firestore();

function loadBuiltInCrewProfiles() {
  const root = path.resolve(__dirname, "..");
  const appJsPath = path.join(root, "app.js");
  const appJs = fs.readFileSync(appJsPath, "utf8").replace(/\nboot\(\);\s*$/, `
globalThis.__backfillData = {
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
  return sandbox.__backfillData.crewRsvpProfiles;
}

function normalizedKey(name, guestOf) {
  return `${String(name || "").trim().toLowerCase()}|${String(guestOf || "").trim().toLowerCase()}`;
}

function seededCrewIdFromRsvpId(rsvpId) {
  const value = String(rsvpId || "");
  if (!value.startsWith(seededIdPrefix)) return "";
  const match = value.match(/^crew_going_(.+)_\d{4}-\d{2}-\d{2}_[a-z-]+$/);
  return match ? match[1] : "";
}

function buildProfileIndex(profiles) {
  const byKey = new Map();
  for (const profile of profiles) {
    const key = normalizedKey(profile.data.name, profile.data.guestOf);
    if (!key || key === "|") continue;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(profile.id);
  }
  return byKey;
}

function buildCrewIndex(crewProfiles) {
  return new Map(
    crewProfiles.map((profile) => [normalizedKey(profile.name, profile.guestOf), profile.id])
  );
}

function resolveProfileId(docId, data, profileIndex, crewIndex) {
  const seededCrewId = seededCrewIdFromRsvpId(docId);
  if (seededCrewId) {
    return { profileId: seededCrewId, reason: "seeded crew id" };
  }

  const key = normalizedKey(data.name, data.guestOf);
  const crewId = crewIndex.get(key);
  if (crewId) {
    return { profileId: crewId, reason: "built-in crew name + guestOf" };
  }

  const matches = profileIndex.get(key) || [];
  if (matches.length === 1) {
    return { profileId: matches[0], reason: "unique name + guestOf" };
  }
  if (matches.length > 1) {
    return { profileId: "", reason: `ambiguous profile match: ${matches.join(", ")}` };
  }
  return { profileId: "", reason: "no matching profile" };
}

async function loadCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ref: doc.ref,
    data: doc.data()
  }));
}

async function commitBatch(writes) {
  if (dryRun || writes.length === 0) return;
  let batch = db.batch();
  let count = 0;
  for (const write of writes) {
    batch.set(write.ref, { profileId: write.profileId }, { merge: true });
    count += 1;
    if (count >= 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
}

async function main() {
  const [profiles, rsvps, summaries] = await Promise.all([
    loadCollection("rsvpProfiles"),
    loadCollection("rsvps"),
    loadCollection("rsvpSummaries")
  ]);
  const profileIndex = buildProfileIndex(profiles);
  const crewIndex = buildCrewIndex(loadBuiltInCrewProfiles());
  const summariesById = new Map(summaries.map((summary) => [summary.id, summary]));
  const writes = [];
  const unresolved = [];

  for (const rsvp of rsvps) {
    const resolved = rsvp.data.profileId
      ? { profileId: rsvp.data.profileId, reason: "existing private profileId" }
      : resolveProfileId(rsvp.id, rsvp.data, profileIndex, crewIndex);
    if (!resolved.profileId) {
      unresolved.push({
        id: rsvp.id,
        name: rsvp.data.name || "",
        guestOf: rsvp.data.guestOf || "",
        reason: resolved.reason
      });
      continue;
    }

    if (!rsvp.data.profileId) {
      writes.push({ ref: rsvp.ref, profileId: resolved.profileId });
    }
    const summary = summariesById.get(rsvp.id);
    if (summary && !summary.data.profileId) {
      writes.push({ ref: summary.ref, profileId: resolved.profileId });
    }
  }

  await commitBatch(writes);

  console.log(`${dryRun ? "Dry run: would update" : "Updated"} ${writes.length} documents.`);
  console.log(`Unresolved RSVPs: ${unresolved.length}`);
  if (unresolved.length) {
    console.log(JSON.stringify(unresolved, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
