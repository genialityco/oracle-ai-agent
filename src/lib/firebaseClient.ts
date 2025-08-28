// src/lib/firebaseClient.ts
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/** Asegura login anónimo y devuelve el user */
export const ensureAnonAuth = async (): Promise<User> => {
  // persistencia local para no perder la sesión al recargar
  await setPersistence(auth, browserLocalPersistence);

  return new Promise<User>((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          unsub();
          resolve(user);
        } else {
          try {
            const cred = await signInAnonymously(auth);
            unsub();
            resolve(cred.user);
          } catch (e) {
            unsub();
            reject(e);
          }
        }
      },
      (err) => {
        reject(err);
      }
    );
  });
};

/** Guarda/actualiza el perfil básico del usuario en Firestore */
export const saveUserIntro = async (
  uid: string,
  data: { nombre: string; email: string; rol: string }
) => {
  const shortId = uid.slice(0, 8);
  const ref = doc(db, 'profilesoracle', uid);
  await setDoc(
    ref,
    {
      uid,
      shortId,
      ...data,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(), // si existe se mantiene el primero por reglas de merge del server
    },
    { merge: true }
  );
  return { uid, shortId };
};
