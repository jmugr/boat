export const firebaseConfig = {
  apiKey: "AIzaSyD4nPM6EymwlnvHy3i5E5-Y97dK5erQ",
  authDomain: "boat-5baa0.firebaseapp.com",
  projectId: "boat-5baa0",
  storageBucket: "boat-5baa0.firebasestorage.app",
  messagingSenderId: "924272103570",
  appId: "1:924272103570:web:524a514667013901ff564b",
  measurementId: "G-TXY7RXKWHN"
};

export function hasFirebaseConfig() {
  return Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value && !value.startsWith("replace-with-")
  );
}
