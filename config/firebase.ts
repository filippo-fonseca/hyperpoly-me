
import { getApps, initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAVkUuo8OZ9MPbgLLaBXhVXI0QS_j6rKYk",
    authDomain: "hyperpoly-me.firebaseapp.com",
    projectId: "hyperpoly-me",
    storageBucket: "hyperpoly-me.firebasestorage.app",
    messagingSenderId: "1027357689110",
    appId: "1:1027357689110:web:084f0ebb002c286371fc37",
    measurementId: "G-DZMENW3RK8"
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Persist across reloads
setPersistence(auth, browserLocalPersistence).catch(() => {});

export const provider = new GoogleAuthProvider();
export async function googleSignIn() {
  const res = await signInWithPopup(auth, provider);
  console.log("Signed in UID:", res.user.uid); // grab this for NEXT_PUBLIC_ADMIN_UID
  return res.user;
}
export async function signOutUser() {
  await signOut(auth);
}

export const ADMIN_UID = "HTal5Nw1qPaESkV4TJUqdbPD7552";
