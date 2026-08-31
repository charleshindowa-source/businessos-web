import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// ============================================================
// Firebase config is read from environment variables at build time
// (see .env.example / README.md "Deploy" section). Locally, copy
// .env.example to .env and fill in the values Firebase shows you when
// you register a "Web app" inside your Firebase project. For GitHub
// Pages deploys, the same values are stored as GitHub Actions repo
// secrets and injected during the build — nothing is hardcoded here,
// so this file is safe to commit as-is.
// ============================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

export const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Anonymous auth gates Firestore/Storage access (see firestore.rules /
// storage.rules — both require request.auth != null). This is not
// per-user identity, but it closes the "anyone who finds the project ID
// can read/write" hole that a fully open ruleset leaves open, and it's
// something that can be turned on with a single checkbox in the Firebase
// console (Authentication → Sign-in method → Anonymous). The app-level
// PIN screen is still the real "who are you" gate on top of this.
export function ensureSignedIn() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { unsub(); resolve(user); return; }
      signInAnonymously(auth).catch(reject);
    }, reject);
  });
}

export { doc, setDoc, onSnapshot, getDoc, ref, uploadBytes, getDownloadURL };
