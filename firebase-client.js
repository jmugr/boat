import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig, hasFirebaseConfig } from "./firebase-config.js";

export const FIRESTORE_COLLECTIONS = {
  slots: "slots",
  rsvps: "rsvps",
  rsvpSummaries: "rsvpSummaries",
  rsvpProfiles: "rsvpProfiles"
};

let db = null;

export function firebaseIsConfigured() {
  return hasFirebaseConfig();
}

export function slotDocumentId(date, slotId) {
  return `${date}_${slotId}`;
}

export function initFirebase() {
  if (!firebaseIsConfigured()) return null;
  if (db) return db;
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  return db;
}

export async function loadPublicSlots() {
  const database = initFirebase();
  if (!database) return { configured: false, slots: [] };

  const snapshot = await getDocs(
    query(collection(database, FIRESTORE_COLLECTIONS.slots), orderBy("date"), orderBy("slotId"))
  );

  return {
    configured: true,
    slots: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  };
}

export async function loadPublicSummaries(slotId) {
  const database = initFirebase();
  if (!database) return { configured: false, summaries: [] };

  const snapshot = await getDocs(
    query(
      collection(database, FIRESTORE_COLLECTIONS.rsvpSummaries),
      where("slotId", "==", slotId),
      orderBy("createdAt")
    )
  );

  return {
    configured: true,
    summaries: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  };
}

export async function loadAllPublicSummaries() {
  const database = initFirebase();
  if (!database) return { configured: false, summaries: [] };

  const snapshot = await getDocs(
    query(collection(database, FIRESTORE_COLLECTIONS.rsvpSummaries), orderBy("createdAt"))
  );

  return {
    configured: true,
    summaries: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  };
}

export async function createRsvp(rsvp) {
  const database = initFirebase();
  if (!database) throw new Error("Firebase is not configured.");

  const createdAt = serverTimestamp();
  const privateDoc = {
    slotId: rsvp.slotId,
    name: rsvp.name,
    guestOf: rsvp.guestOf,
    contact: rsvp.contact,
    status: "confirmed",
    createdAt
  };
  const summaryDoc = {
    slotId: rsvp.slotId,
    name: rsvp.name,
    guestOf: rsvp.guestOf,
    status: "confirmed",
    createdAt
  };

  const privateRef = doc(collection(database, FIRESTORE_COLLECTIONS.rsvps));
  const summaryRef = doc(database, FIRESTORE_COLLECTIONS.rsvpSummaries, privateRef.id);
  const batch = writeBatch(database);
  batch.set(privateRef, privateDoc);
  batch.set(summaryRef, summaryDoc);
  await batch.commit();
  return privateRef.id;
}

export async function updatePublicRsvp(rsvpId, changes) {
  const database = initFirebase();
  if (!database) throw new Error("Firebase is not configured.");

  await updateDoc(doc(database, FIRESTORE_COLLECTIONS.rsvpSummaries, rsvpId), {
    name: changes.name,
    guestOf: changes.guestOf
  });
}

export async function deletePublicRsvp(rsvpId) {
  const database = initFirebase();
  if (!database) throw new Error("Firebase is not configured.");

  await deleteDoc(doc(database, FIRESTORE_COLLECTIONS.rsvpSummaries, rsvpId));
}

export async function loadRsvpProfiles() {
  const database = initFirebase();
  if (!database) return { configured: false, profiles: [] };

  const snapshot = await getDocs(collection(database, FIRESTORE_COLLECTIONS.rsvpProfiles));

  return {
    configured: true,
    profiles: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  };
}

export async function createRsvpProfile(profile) {
  const database = initFirebase();
  if (!database) throw new Error("Firebase is not configured.");

  const timestamp = serverTimestamp();
  const ref = doc(collection(database, FIRESTORE_COLLECTIONS.rsvpProfiles));
  await writeBatch(database)
    .set(ref, {
      name: profile.name,
      guestOf: profile.guestOf,
      contact: profile.contact,
      createdAt: timestamp,
      updatedAt: timestamp
    })
    .commit();
  return ref.id;
}

export async function updateRsvpProfile(profileId, profile) {
  const database = initFirebase();
  if (!database) throw new Error("Firebase is not configured.");

  await updateDoc(doc(database, FIRESTORE_COLLECTIONS.rsvpProfiles, profileId), {
    name: profile.name,
    guestOf: profile.guestOf,
    contact: profile.contact,
    updatedAt: serverTimestamp()
  });
}
