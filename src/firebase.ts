import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache,
  Firestore
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Inisialisasi Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let db: Firestore;

try {
  // Inisialisasi dengan persistent cache dan paksa long polling untuk menembus blokir jaringan
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({}),
    experimentalForceLongPolling: true
  });
} catch (e: any) {
  // Jika gagal, gunakan getFirestore standar
  console.warn("Firestore persistence init failed, falling back to default:", e);
  db = getFirestore(app);
}

const auth = getAuth(app);

export { app, db, auth };
