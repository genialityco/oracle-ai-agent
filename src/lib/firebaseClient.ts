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
  collection,
  addDoc,            // 👈 importa addDoc
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
  await setPersistence(auth, browserLocalPersistence);
  return new Promise<User>((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      async (user) => {
        if (user) {
          unsub(); resolve(user);
        } else {
          try {
            const cred = await signInAnonymously(auth);
            unsub(); resolve(cred.user);
          } catch (e) { unsub(); reject(e); }
        }
      },
      (err) => reject(err)
    );
  });
};

/** Guarda/actualiza el perfil básico del usuario */
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
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
  return { uid, shortId };
};

/** Guarda una respuesta de encuesta */
export const saveSurveyResponse = async (params: {
  uid: string;
  answers: Record<string, string>;
  progress: number;            // 0..100
  step: number;                // índice de sección actual (0-based)
  totalSections: number;
  completed: boolean;          // true si envió
}) => {
  const { uid, answers, progress, step, totalSections, completed } = params;

  const ref = await addDoc(collection(db, 'surveyResponsesOracle'), {
    uid,
    answers,
    progress,
    step,
    totalSections,
    completed,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: ref.id };
};
