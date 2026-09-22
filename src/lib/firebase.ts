import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
  setLogLevel,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Reduce console noise for expected offline transitions
try {
  setLogLevel('error');
} catch {
  // Ignore if not supported in environment
}

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with long-polling transport for iframe sandbox / proxy stability
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    firebaseConfig.firestoreDatabaseId || undefined
  );
} catch {
  try {
    firestoreInstance = initializeFirestore(
      app,
      {
        experimentalForceLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId || undefined
    );
  } catch {
    firestoreInstance = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
}

export const db = firestoreInstance;
export { doc, getDoc, setDoc, collection, getDocs, deleteDoc, writeBatch };

export const firebaseInfo = {
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
  storageBucket: firebaseConfig.storageBucket,
};

/**
 * Validates connection to Firestore with offline grace
 */
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = doc(db, 'settings', 'general');
    // Using getDoc with timeout to avoid hanging or unhandled unavailable errors
    await Promise.race([
      getDoc(docRef),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 6000)
      ),
    ]);
    return { success: true, message: 'Berhasil terhubung ke Firebase Firestore' };
  } catch (err: any) {
    if (err?.code === 'not-found') {
      return { success: true, message: 'Terhubung ke Firestore (Dokumen pengaturan belum diinisialisasi)' };
    }
    if (
      err?.code === 'unavailable' ||
      err?.message?.includes('unavailable') ||
      err?.message?.includes('offline') ||
      err?.message?.includes('Connection timeout')
    ) {
      return {
        success: false,
        message: 'Klien Firestore beroperasi dalam mode offline lokal (koneksi backend sedang diupayakan)',
      };
    }
    return { success: false, message: err?.message || 'Status koneksi Firestore belum siap' };
  }
}

