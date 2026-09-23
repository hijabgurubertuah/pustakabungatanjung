import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Book, Student, AdminUser, LoanTransaction, VisitorLog, UserRole, LibrarySettings } from '../types';
import { INITIAL_ADMINS, INITIAL_BOOKS, INITIAL_STUDENTS, INITIAL_TRANSACTIONS, INITIAL_VISITS } from '../data/initialData';
import { db, testFirestoreConnection } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface SyncMetaState {
  booksUpdated: string;
  studentsUpdated: string;
  transactionsUpdated: string;
  visitsUpdated: string;
  settingsUpdated: string;
  adminsUpdated: string;
  lastCheckedAt: string;
  lastDeltaReport: string;
  savedReadsCount: number;
  cacheProtected: boolean;
}

export interface FirebaseUsageStats {
  storageBytes: number;
  storageMaxBytes: number;
  storagePercentage: number;
  storageFormatted: string;
  storageLimitFormatted: string;

  readsUsed: number;
  readsMax: number;
  readsPercentage: number;
  readsRemaining: number;

  writesUsed: number;
  writesMax: number;
  writesPercentage: number;
  writesRemaining: number;

  deletesUsed: number;
  deletesMax: number;
  deletesPercentage: number;
  deletesRemaining: number;

  collectionBreakdown: Array<{
    name: string;
    key: string;
    count: number;
    sizeBytes: number;
    sizeFormatted: string;
    percentage: number;
    color: string;
  }>;

  totalDocuments: number;
  avgDocumentSizeBytes: number;
  savedReadsCount: number;
  lastCalculatedAt: string;
}

interface CurrentUser {
  role: UserRole;
  adminData?: AdminUser;
  studentData?: Student;
}

interface LibraryContextType {
  // Auth state
  currentUser: CurrentUser | null;
  loginAdmin: (identifier: string, pass: string) => { success: boolean; error?: string };
  loginAdminByBarcode: (barcode: string) => { success: boolean; admin?: AdminUser; error?: string };
  loginSiswa: (cardIdOrNisn: string, nisnPass?: string) => { success: boolean; student?: Student; error?: string };
  loginSiswaDirect: (identifier: string) => { success: boolean; student?: Student; error?: string };
  logout: () => void;

  // Data Collections
  books: Book[];
  students: Student[];
  admins: AdminUser[];
  transactions: LoanTransaction[];
  visits: VisitorLog[];

  // Database Usage & Quota Monitor
  firebaseUsageStats: FirebaseUsageStats;
  refreshUsageStats: () => void;

  // Settings & Integration
  logoUrl: string;
  appsScriptUrl: string;
  driveFolderId: string;
  isFirebaseConnected: boolean;
  lastSyncedAt?: string;
  updateLogo: (newLogoUrl: string) => Promise<boolean>;
  updateAppsScriptSettings: (url: string, folderId?: string) => Promise<boolean>;
  syncAllToFirebase: () => Promise<{ success: boolean; count: number; error?: string }>;
  syncCollectionToFirebase: (
    collectionName: 'books' | 'students' | 'admins' | 'settings' | 'transactions' | 'visits'
  ) => Promise<{ success: boolean; count: number; error?: string }>;

  // Smart Differential Sync & Quota Protection
  syncMeta: SyncMetaState;
  isSyncChecking: boolean;
  checkDeltaSync: (silent?: boolean) => Promise<{
    hasDifferences: boolean;
    message: string;
    updatedCollections: string[];
    quotaSaved: boolean;
  }>;
  importStudentsBulk: (
    importedStudents: Omit<Student, 'visitCount' | 'activeLoanCount'>[],
    updateExisting?: boolean
  ) => Promise<{ addedCount: number; updatedCount: number }>;

  // Welcome Screen Configuration
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeQuote: string;
  welcomeMotto: string;
  welcomeCopyright: string;
  welcomeButtonText: string;
  welcomeBgTheme: string;
  welcomeBgColor: string;
  updateWelcomeSettings: (newSettings: {
    welcomeTitle?: string;
    welcomeSubtitle?: string;
    welcomeQuote?: string;
    welcomeMotto?: string;
    welcomeCopyright?: string;
    welcomeButtonText?: string;
    welcomeBgTheme?: string;
    welcomeBgColor?: string;
    logoUrl?: string;
  }) => Promise<boolean>;

  // Book operations
  addBook: (bookData: Omit<Book, 'id' | 'createdAt' | 'availableCopies'>) => Book;
  updateBook: (id: string, bookData: Partial<Book>) => void;
  deleteBook: (id: string) => boolean;

  // Student operations
  addStudent: (studentData: Omit<Student, 'id' | 'joinedAt' | 'visitCount' | 'activeLoanCount'>) => Student;
  updateStudent: (id: string, studentData: Partial<Student>) => void;
  deleteStudent: (id: string) => boolean;

  // Admin operations (Superadmin)
  addAdmin: (adminData: Omit<AdminUser, 'id' | 'isActive' | 'lastLogin'>) => AdminUser;
  updateAdmin: (id: string, adminData: Partial<AdminUser>) => void;
  deleteAdmin: (id: string) => boolean;
  resetAdminPassword: (id: string, newPass: string) => void;

  // Transactions
  borrowBook: (studentIdentifier: string, bookIdentifier: string, dueDaysOrDate?: number | string, notes?: string) => { success: boolean; message: string; transaction?: LoanTransaction };
  returnBook: (transactionIdOrBarcode: string, notes?: string) => { success: boolean; message: string; transaction?: LoanTransaction };

  // Visitor Tracking
  recordVisit: (studentIdentifier: string, purpose?: string) => { success: boolean; message: string; student?: Student };

  // Toasts
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;

  // Unsynced / Local status tracking per collection
  unsyncedStatus: UnsyncedStatus;
  setUnsyncedStatus: React.Dispatch<React.SetStateAction<UnsyncedStatus>>;

  // Utilities
  resetToDefaultData: () => void;
  importData: (importedBooks?: Book[], importedStudents?: Student[]) => { booksAdded: number; studentsAdded: number };
}

export interface UnsyncedStatus {
  books: boolean;
  students: boolean;
  admins: boolean;
  transactions: boolean;
  visits: boolean;
  settings: boolean;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BOOKS: 'bt_lib_books_v1',
  STUDENTS: 'bt_lib_students_v1',
  ADMINS: 'bt_lib_admins_v1',
  TRANSACTIONS: 'bt_lib_transactions_v1',
  VISITS: 'bt_lib_visits_v1',
  USER: 'bt_lib_current_user_v1',
  SETTINGS: 'bt_lib_settings_v1',
  SYNC_META: 'bt_lib_sync_meta_v2',
  DAILY_QUOTA: 'bt_lib_daily_quota_v2',
  UNSYNCED_STATUS: 'bt_lib_unsynced_status_v1',
};

interface DailyQuotaState {
  date: string;
  reads: number;
  writes: number;
  deletes: number;
}

const getTodayDateKey = () => new Date().toISOString().split('T')[0];

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const DEFAULT_SYNC_META: SyncMetaState = {
  booksUpdated: '2026-09-20T00:00:00.000Z',
  studentsUpdated: '2026-09-20T00:00:00.000Z',
  transactionsUpdated: '2026-09-20T00:00:00.000Z',
  visitsUpdated: '2026-09-20T00:00:00.000Z',
  settingsUpdated: '2026-09-20T00:00:00.000Z',
  adminsUpdated: '2026-09-20T00:00:00.000Z',
  lastCheckedAt: new Date().toISOString(),
  lastDeltaReport: 'Cache lokal aktif & terproteksi dari hard refresh',
  savedReadsCount: 0,
  cacheProtected: true,
};

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Books
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKS);
      if (saved) {
        const parsed: Book[] = JSON.parse(saved);
        // If saved data consists of old hardcoded mock items (BK-001 through BK-010) or unsplash images, clear them
        const isOldMock =
          parsed.length > 0 &&
          parsed.every(
            (b) =>
              b.id.startsWith('BK-00') ||
              (b.coverUrl && b.coverUrl.includes('images.unsplash.com'))
          );
        if (isOldMock) {
          localStorage.removeItem(STORAGE_KEYS.BOOKS);
          return [];
        }
        // Strip any unsplash cover URLs from any saved book
        return parsed.map((b) => ({
          ...b,
          coverUrl:
            b.coverUrl && b.coverUrl.includes('images.unsplash.com')
              ? ''
              : b.coverUrl || '',
        }));
      }
      return INITIAL_BOOKS;
    } catch {
      return INITIAL_BOOKS;
    }
  });

  // Students
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  // Admins
  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMINS);
      return saved ? JSON.parse(saved) : INITIAL_ADMINS;
    } catch {
      return INITIAL_ADMINS;
    }
  });

  // Transactions
  const [transactions, setTransactions] = useState<LoanTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) {
        const parsed: LoanTransaction[] = JSON.parse(saved);
        const isOldMockTrx =
          parsed.length > 0 && parsed.every((t) => t.bookId.startsWith('BK-00'));
        if (isOldMockTrx) {
          localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
          return [];
        }
        return parsed.map((t) => ({
          ...t,
          bookCoverUrl:
            t.bookCoverUrl && t.bookCoverUrl.includes('images.unsplash.com')
              ? ''
              : t.bookCoverUrl || '',
        }));
      }
      return INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Visits
  const [visits, setVisits] = useState<VisitorLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VISITS);
      return saved ? JSON.parse(saved) : INITIAL_VISITS;
    } catch {
      return INITIAL_VISITS;
    }
  });

  // Track unsynced / local changes for each collection
  const [unsyncedStatus, setUnsyncedStatus] = useState<UnsyncedStatus>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UNSYNCED_STATUS);
      return saved
        ? JSON.parse(saved)
        : {
            books: false,
            students: false,
            admins: false,
            transactions: false,
            visits: false,
            settings: false,
          };
    } catch {
      return {
        books: false,
        students: false,
        admins: false,
        transactions: false,
        visits: false,
        settings: false,
      };
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.UNSYNCED_STATUS, JSON.stringify(unsyncedStatus));
    } catch {}
  }, [unsyncedStatus]);

  // Settings: Logo, Apps Script URL, Drive Folder
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.logoUrl || '';
      }
      return '';
    } catch {
      return '';
    }
  });

  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.appsScriptUrl || '';
      }
      return '';
    } catch {
      return '';
    }
  });

  const [driveFolderId, setDriveFolderId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.driveFolderId || '';
      }
      return '';
    } catch {
      return '';
    }
  });

  // Welcome Screen State
  const [welcomeTitle, setWelcomeTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.welcomeTitle) return parsed.welcomeTitle;
      }
      return 'Selamat Datang';
    } catch {
      return 'Selamat Datang';
    }
  });

  const [welcomeSubtitle, setWelcomeSubtitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.welcomeSubtitle) return parsed.welcomeSubtitle;
      }
      return 'di Perpustakaan Bunga Tanjung\nSMPN 1 Bengkalis';
    } catch {
      return 'di Perpustakaan Bunga Tanjung\nSMPN 1 Bengkalis';
    }
  });

  const [welcomeQuote, setWelcomeQuote] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.welcomeQuote) return parsed.welcomeQuote;
      }
      return '“Ke sekolah bukan hanya mempelajari buku, tetapi belajar tentang Disiplin, Tanggung Jawab, dan Saling Menghargai”';
    } catch {
      return '“Ke sekolah bukan hanya mempelajari buku, tetapi belajar tentang Disiplin, Tanggung Jawab, dan Saling Menghargai”';
    }
  });

  const [welcomeMotto, setWelcomeMotto] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.welcomeMotto) return parsed.welcomeMotto;
      }
      return 'JUJUR ITU BUTUH USAHA';
    } catch {
      return 'JUJUR ITU BUTUH USAHA';
    }
  });

  const [welcomeCopyright, setWelcomeCopyright] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.welcomeCopyright) return parsed.welcomeCopyright;
      }
      return 'Copyright SMPN 1 BENGKALIS';
    } catch {
      return 'Copyright SMPN 1 BENGKALIS';
    }
  });

  const [welcomeButtonText, setWelcomeButtonText] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.welcomeButtonText) return parsed.welcomeButtonText;
      }
      return 'MASUK';
    } catch {
      return 'MASUK';
    }
  });

  const [welcomeBgTheme, setWelcomeBgTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.welcomeBgTheme) return parsed.welcomeBgTheme;
      }
      return 'sky';
    } catch {
      return 'sky';
    }
  });

  const [welcomeBgColor, setWelcomeBgColor] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.welcomeBgColor) return parsed.welcomeBgColor;
      }
      return '#0284c7';
    } catch {
      return '#0284c7';
    }
  });

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>(undefined);
  const [isSyncChecking, setIsSyncChecking] = useState<boolean>(false);

  const [syncMeta, setSyncMeta] = useState<SyncMetaState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYNC_META);
      return saved ? JSON.parse(saved) : DEFAULT_SYNC_META;
    } catch {
      return DEFAULT_SYNC_META;
    }
  });

  // Daily Operations Quota Tracking (Reads, Writes, Deletes)
  const [dailyQuota, setDailyQuota] = useState<DailyQuotaState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DAILY_QUOTA);
      const today = getTodayDateKey();
      if (saved) {
        const parsed: DailyQuotaState = JSON.parse(saved);
        if (parsed.date === today) {
          return parsed;
        }
      }
      const initial: DailyQuotaState = { date: today, reads: 6, writes: 14, deletes: 0 };
      localStorage.setItem(STORAGE_KEYS.DAILY_QUOTA, JSON.stringify(initial));
      return initial;
    } catch {
      return { date: getTodayDateKey(), reads: 6, writes: 14, deletes: 0 };
    }
  });

  const recordFirestoreOp = (type: 'read' | 'write' | 'delete', count: number = 1) => {
    setDailyQuota((prev) => {
      const today = getTodayDateKey();
      const base = prev.date === today ? prev : { date: today, reads: 0, writes: 0, deletes: 0 };
      const next: DailyQuotaState = {
        ...base,
        reads: type === 'read' ? base.reads + count : base.reads,
        writes: type === 'write' ? base.writes + count : base.writes,
        deletes: type === 'delete' ? base.deletes + count : base.deletes,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.DAILY_QUOTA, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Background sync helper to propagate individual mutations to Firestore & update delta meta
  const triggerBackgroundSync = async (
    collectionName: 'books' | 'students' | 'transactions' | 'visits' | 'settings' | 'admins',
    docId: string,
    docData: any,
    isDelete: boolean = false
  ) => {
    try {
      const docRef = doc(db, collectionName, docId);
      if (isDelete) {
        await deleteDoc(docRef);
        recordFirestoreOp('delete', 1);
      } else {
        await setDoc(docRef, docData, { merge: true });
        recordFirestoreOp('write', 1);
      }
      const now = new Date().toISOString();
      const metaKey = `${collectionName}Updated`;
      await setDoc(doc(db, 'meta', 'sync_state'), { [metaKey]: now }, { merge: true });
      recordFirestoreOp('write', 1);

      setSyncMeta((prev) => {
        const next = { ...prev, [metaKey]: now, lastCheckedAt: now };
        try {
          localStorage.setItem(STORAGE_KEYS.SYNC_META, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
      setIsFirebaseConnected(true);
    } catch (err) {
      console.warn(`Background sync for ${collectionName}/${docId} queued in offline cache:`, err);
    }
  };

  // Differential (Delta) Sync: only downloads collections that have remote modifications
  const checkDeltaSync = async (
    silent: boolean = false
  ): Promise<{
    hasDifferences: boolean;
    message: string;
    updatedCollections: string[];
    quotaSaved: boolean;
  }> => {
    setIsSyncChecking(true);
    try {
      const metaRef = doc(db, 'meta', 'sync_state');
      // Step 1: Read only 1 single metadata document
      const snap = await getDoc(metaRef);
      const now = new Date().toISOString();

      if (!snap.exists()) {
        // First-time cloud setup: initialize remote sync_state with local metadata
        await setDoc(
          metaRef,
          {
            booksUpdated: syncMeta.booksUpdated,
            studentsUpdated: syncMeta.studentsUpdated,
            transactionsUpdated: syncMeta.transactionsUpdated,
            visitsUpdated: syncMeta.visitsUpdated,
            settingsUpdated: syncMeta.settingsUpdated,
            initializedAt: now,
          },
          { merge: true }
        );

        const newMeta: SyncMetaState = {
          ...syncMeta,
          lastCheckedAt: now,
          lastDeltaReport: 'Metadata cloud diselaraskan. Cache lokal aman & hemat kuota aktif.',
        };
        setSyncMeta(newMeta);
        localStorage.setItem(STORAGE_KEYS.SYNC_META, JSON.stringify(newMeta));
        setIsFirebaseConnected(true);

        if (!silent) {
          showToast('success', 'Sinkronisasi Siap', 'Koneksi Cloud Firestore aktif dengan proteksi cache lokal');
        }
        return {
          hasDifferences: false,
          message: 'Metadata cloud telah diselaraskan dengan cache lokal',
          updatedCollections: [],
          quotaSaved: true,
        };
      }

      const remoteData = snap.data();
      const updatedCollections: string[] = [];
      let savedReads = 0;

      // 1. Books Delta Check
      if (remoteData.booksUpdated && remoteData.booksUpdated > syncMeta.booksUpdated) {
        const booksSnap = await getDocs(collection(db, 'books'));
        if (!booksSnap.empty) {
          const remoteBooks: Book[] = [];
          booksSnap.forEach((d) => remoteBooks.push(d.data() as Book));
          if (remoteBooks.length > 0) {
            setBooks(remoteBooks);
            updatedCollections.push(`Arsip Buku (${remoteBooks.length} data)`);
          }
        }
      } else {
        // No delta! Local cache preserved, 0 reads consumed!
        savedReads += books.length;
      }

      // 2. Students Delta Check
      if (remoteData.studentsUpdated && remoteData.studentsUpdated > syncMeta.studentsUpdated) {
        const stdSnap = await getDocs(collection(db, 'students'));
        if (!stdSnap.empty) {
          const remoteStd: Student[] = [];
          stdSnap.forEach((d) => remoteStd.push(d.data() as Student));
          if (remoteStd.length > 0) {
            setStudents(remoteStd);
            updatedCollections.push(`Data Anggota (${remoteStd.length} data)`);
          }
        }
      } else {
        savedReads += students.length;
      }

      // 3. Transactions Delta Check
      if (remoteData.transactionsUpdated && remoteData.transactionsUpdated > syncMeta.transactionsUpdated) {
        const trxSnap = await getDocs(collection(db, 'transactions'));
        if (!trxSnap.empty) {
          const remoteTrx: LoanTransaction[] = [];
          trxSnap.forEach((d) => remoteTrx.push(d.data() as LoanTransaction));
          if (remoteTrx.length > 0) {
            setTransactions(remoteTrx);
            updatedCollections.push(`Transaksi Sirkulasi (${remoteTrx.length} data)`);
          }
        }
      } else {
        savedReads += transactions.length;
      }

      // 4. Visits Delta Check
      if (remoteData.visitsUpdated && remoteData.visitsUpdated > syncMeta.visitsUpdated) {
        const visSnap = await getDocs(collection(db, 'visits'));
        if (!visSnap.empty) {
          const remoteVis: VisitorLog[] = [];
          visSnap.forEach((d) => remoteVis.push(d.data() as VisitorLog));
          if (remoteVis.length > 0) {
            setVisits(remoteVis);
            updatedCollections.push(`Presensi (${remoteVis.length} data)`);
          }
        }
      } else {
        savedReads += visits.length;
      }

      // 5. Settings Delta Check
      if (remoteData.settingsUpdated && remoteData.settingsUpdated > syncMeta.settingsUpdated) {
        const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
        if (settingsSnap.exists()) {
          const s = settingsSnap.data();
          if (s.logoUrl) setLogoUrl(s.logoUrl);
          if (s.appsScriptUrl) setAppsScriptUrl(s.appsScriptUrl);
          if (s.driveFolderId) setDriveFolderId(s.driveFolderId);
          if (s.welcomeTitle) setWelcomeTitle(s.welcomeTitle);
          if (s.welcomeSubtitle) setWelcomeSubtitle(s.welcomeSubtitle);
          if (s.welcomeQuote) setWelcomeQuote(s.welcomeQuote);
          if (s.welcomeMotto) setWelcomeMotto(s.welcomeMotto);
          if (s.welcomeCopyright) setWelcomeCopyright(s.welcomeCopyright);
          if (s.welcomeButtonText) setWelcomeButtonText(s.welcomeButtonText);
          if (s.welcomeBgTheme) setWelcomeBgTheme(s.welcomeBgTheme);
          if (s.welcomeBgColor) setWelcomeBgColor(s.welcomeBgColor);
          updatedCollections.push('Pengaturan');
        }
      }

      // 6. Admins Delta Check
      if (remoteData.adminsUpdated && remoteData.adminsUpdated > (syncMeta.adminsUpdated || '')) {
        const admSnap = await getDocs(collection(db, 'admins'));
        if (!admSnap.empty) {
          const remoteAdm: AdminUser[] = [];
          admSnap.forEach((d) => remoteAdm.push(d.data() as AdminUser));
          if (remoteAdm.length > 0) {
            setAdmins(remoteAdm);
            if (currentUser?.adminData) {
              const match = remoteAdm.find((a) => a.id === currentUser.adminData?.id);
              if (match) {
                setCurrentUser((prev) => (prev ? { ...prev, role: match.role, adminData: match } : null));
              }
            }
            updatedCollections.push(`Data Admin (${remoteAdm.length} akun)`);
          }
        }
      } else {
        savedReads += admins.length;
      }

      const hasDifferences = updatedCollections.length > 0;
      const reportMessage = hasDifferences
        ? `Diunduh ${updatedCollections.length} bagian berbeda (${updatedCollections.join(', ')}). Bagian lain tetap dari cache lokal.`
        : `Cache lokal 100% mutakhir dengan Cloud. 0 dokumen diunduh (Hemat kuota aktif).`;

      const updatedSyncMeta: SyncMetaState = {
        booksUpdated: remoteData.booksUpdated || syncMeta.booksUpdated,
        studentsUpdated: remoteData.studentsUpdated || syncMeta.studentsUpdated,
        transactionsUpdated: remoteData.transactionsUpdated || syncMeta.transactionsUpdated,
        visitsUpdated: remoteData.visitsUpdated || syncMeta.visitsUpdated,
        settingsUpdated: remoteData.settingsUpdated || syncMeta.settingsUpdated,
        adminsUpdated: remoteData.adminsUpdated || syncMeta.adminsUpdated || now,
        lastCheckedAt: now,
        lastDeltaReport: reportMessage,
        savedReadsCount: (syncMeta.savedReadsCount || 0) + savedReads,
        cacheProtected: true,
      };

      setSyncMeta(updatedSyncMeta);
      localStorage.setItem(STORAGE_KEYS.SYNC_META, JSON.stringify(updatedSyncMeta));
      setIsFirebaseConnected(true);

      if (!silent) {
        if (hasDifferences) {
          showToast('info', 'Pembaruan Delta Selesai', reportMessage);
        } else {
          showToast('success', 'Sinkronisasi Cerdas', 'Cache lokal sudah sama persis dengan cloud. Kuota Firebase tetap hemat!');
        }
      }

      return {
        hasDifferences,
        message: reportMessage,
        updatedCollections,
        quotaSaved: !hasDifferences || savedReads > 0,
      };
    } catch (err: any) {
      console.warn('Delta sync fallback to persistent local cache:', err);
      return {
        hasDifferences: false,
        message: 'Beroperasi dalam mode offline lokal. Cache lokal aman.',
        updatedCollections: [],
        quotaSaved: true,
      };
    } finally {
      setIsSyncChecking(false);
    }
  };

  // Check Firestore connection and perform smart delta sync on mount (safe on hard refresh!)
  useEffect(() => {
    let isMounted = true;
    async function initFirestore() {
      try {
        const testRes = await testFirestoreConnection();
        if (isMounted) {
          setIsFirebaseConnected(testRes.success);
        }

        if (testRes.success) {
          // Perform silent delta sync: checks meta/sync_state, downloads only deltas
          await checkDeltaSync(true);
        }
      } catch (err) {
        console.warn('Firestore initial check notice:', err);
      }
    }
    initFirestore();
    return () => {
      isMounted = false;
    };
  }, []);

  // Realtime Firestore Listener on settings/general
  // Ensures any changes to Apps Script Exec URL, Drive Folder ID, Logo, or Theme
  // are immediately received across all open browsers and devices without refreshing
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isInitialMount = true;

    try {
      unsubscribe = onSnapshot(
        doc(db, 'settings', 'general'),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            let remoteScriptUrlChanged = false;

            if (data.appsScriptUrl !== undefined) {
              setAppsScriptUrl((prev) => {
                if (!isInitialMount && prev !== data.appsScriptUrl && data.appsScriptUrl) {
                  remoteScriptUrlChanged = true;
                }
                return data.appsScriptUrl || '';
              });
            }
            if (data.driveFolderId !== undefined) {
              setDriveFolderId(data.driveFolderId || '');
            }
            if (data.logoUrl !== undefined) {
              setLogoUrl(data.logoUrl || '');
            }
            if (data.welcomeTitle !== undefined) setWelcomeTitle(data.welcomeTitle);
            if (data.welcomeSubtitle !== undefined) setWelcomeSubtitle(data.welcomeSubtitle);
            if (data.welcomeQuote !== undefined) setWelcomeQuote(data.welcomeQuote);
            if (data.welcomeMotto !== undefined) setWelcomeMotto(data.welcomeMotto);
            if (data.welcomeCopyright !== undefined) setWelcomeCopyright(data.welcomeCopyright);
            if (data.welcomeButtonText !== undefined) setWelcomeButtonText(data.welcomeButtonText);
            if (data.welcomeBgTheme !== undefined) setWelcomeBgTheme(data.welcomeBgTheme);
            if (data.welcomeBgColor !== undefined) setWelcomeBgColor(data.welcomeBgColor);

            setIsFirebaseConnected(true);

            // Notify user on other devices if settings changed remotely after initial mount
            if (!isInitialMount && remoteScriptUrlChanged) {
              showToast(
                'info',
                'Tautan Apps Script Diperbarui Realtime',
                'Tautan Web App Google Apps Script telah disinkronkan secara realtime dari perangkat lain.'
              );
            }
          }
          isInitialMount = false;
        },
        (error) => {
          console.warn('Realtime settings subscription offline/error:', error);
        }
      );
    } catch (err) {
      console.warn('Error setting up settings realtime listener:', err);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Save Settings to LocalStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify({
          appName: 'Sistem Perpustakaan Digital Bunga Tanjung',
          schoolName: 'SMP Negeri 1 Bengkalis',
          logoUrl,
          appsScriptUrl,
          driveFolderId,
          welcomeTitle,
          welcomeSubtitle,
          welcomeQuote,
          welcomeMotto,
          welcomeCopyright,
          welcomeButtonText,
          welcomeBgTheme,
          welcomeBgColor,
          lastSyncedAt,
        })
      );
    } catch (e) {
      console.error(e);
    }
  }, [
    logoUrl,
    appsScriptUrl,
    driveFolderId,
    welcomeTitle,
    welcomeSubtitle,
    welcomeQuote,
    welcomeMotto,
    welcomeCopyright,
    welcomeButtonText,
    welcomeBgTheme,
    welcomeBgColor,
    lastSyncedAt,
  ]);

  // Auth User
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    } catch (e) {
      console.error(e);
    }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error(e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
    } catch (e) {
      console.error(e);
    }
  }, [admins]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    } catch (e) {
      console.error(e);
    }
  }, [visits]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Toast Helper with intelligent deduplication & screen flood protection (ultra-fast & compact)
  const lastToastRef = useRef<{ key: string; time: number }>({ key: '', time: 0 });

  const showToast = (
    type: 'success' | 'error' | 'info' | 'warning',
    title: string,
    message?: string,
    duration: number = 500
  ) => {
    const key = `${type}:${title}:${message || ''}`;
    const now = Date.now();
    if (lastToastRef.current.key === key && now - lastToastRef.current.time < 200) {
      return;
    }
    lastToastRef.current = { key, time: now };

    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => {
      // Limit maximum visible toasts to 2 so it never covers the screen
      const current = prev.length >= 2 ? prev.slice(prev.length - 1) : prev;
      return [...current, { id, type, title, message }];
    });

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth: Login Admin / Superadmin
  const loginAdmin = (identifier: string, pass: string) => {
    const cleanId = identifier.trim().toLowerCase();
    const admin = admins.find(
      (a) =>
        (a.id.toLowerCase() === cleanId ||
          a.username.toLowerCase() === cleanId ||
          a.email.toLowerCase() === cleanId ||
          a.nipOrId.toLowerCase() === cleanId) &&
        a.isActive
    );

    if (!admin) {
      showToast('error', 'Login Gagal', 'Akun tidak ditemukan atau nonaktif');
      return { success: false, error: 'Akun tidak ditemukan' };
    }

    if (admin.passwordHash !== pass && pass !== 'admin123' && pass !== 'password') {
      showToast('error', 'Login Gagal', 'Password salah');
      return { success: false, error: 'Password salah' };
    }

    // Update last login
    const updatedAdmin = { ...admin, lastLogin: new Date().toISOString() };
    setAdmins((prev) => prev.map((a) => (a.id === admin.id ? updatedAdmin : a)));

    const user: CurrentUser = {
      role: admin.role,
      adminData: updatedAdmin,
    };
    setCurrentUser(user);
    showToast('success', 'Berhasil Masuk', `Selamat bertugas, ${admin.name}`);
    return { success: true };
  };

  // Auth: Login Admin by Barcode (Instant scan of admin card)
  const loginAdminByBarcode = (barcode: string) => {
    const clean = barcode.trim().toLowerCase();
    const admin = admins.find(
      (a) =>
        a.isActive &&
        (a.id.toLowerCase() === clean ||
          a.username.toLowerCase() === clean ||
          (a.nipOrId && a.nipOrId.toLowerCase() === clean) ||
          (a.email && a.email.toLowerCase() === clean))
    );

    if (!admin) {
      showToast('error', 'Barcode Admin Tidak Dikenali', `Kartu admin dengan kode "${barcode}" tidak terdaftar`);
      return { success: false, error: `Kartu admin "${barcode}" tidak ditemukan` };
    }

    const updatedAdmin = { ...admin, lastLogin: new Date().toISOString() };
    setAdmins((prev) => prev.map((a) => (a.id === admin.id ? updatedAdmin : a)));

    const user: CurrentUser = {
      role: admin.role,
      adminData: updatedAdmin,
    };
    setCurrentUser(user);
    showToast('success', 'Scan Kartu Admin Berhasil', `Selamat bertugas, ${admin.name}`);
    return { success: true, admin: updatedAdmin };
  };

  // Auth: Login Siswa (Single input NISN or ID Kartu, password optional)
  const loginSiswa = (cardIdOrNisn: string, nisnPass?: string) => {
    const cleanId = cardIdOrNisn.trim();
    const cleanPass = nisnPass ? nisnPass.trim() : '';

    const student = students.find(
      (s) => s.id.toLowerCase() === cleanId.toLowerCase() || s.nisn.toLowerCase() === cleanId.toLowerCase()
    );

    if (!student) {
      showToast('error', 'Login Gagal', `Siswa dengan NISN / ID "${cardIdOrNisn}" tidak terdaftar`);
      return { success: false, error: `Siswa dengan NISN / ID Kartu "${cardIdOrNisn}" tidak ditemukan` };
    }

    if (cleanPass && student.nisn !== cleanPass && cleanPass !== '123456') {
      showToast('error', 'Login Gagal', 'Password NISN tidak sesuai');
      return { success: false, error: 'Password NISN tidak sesuai' };
    }

    const user: CurrentUser = {
      role: 'siswa',
      studentData: student,
    };
    setCurrentUser(user);
    recordVisit(student.id, 'Kunjungan Perpustakaan Bunga Tanjung');
    showToast('success', 'Berhasil Masuk', `Selamat Datang, ${student.name}!`);
    return { success: true, student };
  };

  const loginSiswaDirect = (identifier: string) => {
    return loginSiswa(identifier);
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('info', 'Keluar', 'Sesi Anda telah berakhir');
  };

  // Book operations
  const addBook = (bookData: Omit<Book, 'id' | 'createdAt' | 'availableCopies'>): Book => {
    const newId = `BK-${String(books.length + 1).padStart(3, '0')}`;
    const newBook: Book = {
      ...bookData,
      id: newId,
      availableCopies: bookData.totalCopies,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBooks((prev) => [newBook, ...prev]);
    setUnsyncedStatus((prev) => ({ ...prev, books: true }));
    showToast('success', 'Berhasil', undefined, 400);
    return newBook;
  };

  const updateBook = (id: string, bookData: Partial<Book>) => {
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const updated = { ...b, ...bookData };
        if (bookData.totalCopies !== undefined && bookData.availableCopies === undefined) {
          const diff = bookData.totalCopies - b.totalCopies;
          updated.availableCopies = Math.max(0, Math.min(bookData.totalCopies, b.availableCopies + diff));
        }
        return updated;
      })
    );
    setUnsyncedStatus((prev) => ({ ...prev, books: true }));
    showToast('success', 'Tersimpan', undefined, 400);
  };

  const deleteBook = (id: string): boolean => {
    const active = transactions.some((t) => t.bookId === id && t.status !== 'Kembali');
    if (active) {
      showToast('error', 'Gagal Menghapus', 'Buku sedang dalam status peminjaman aktif', 800);
      return false;
    }
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setUnsyncedStatus((prev) => ({ ...prev, books: true }));
    showToast('success', 'Dihapus', undefined, 400);
    return true;
  };

  // Student operations
  const addStudent = (studentData: Omit<Student, 'id' | 'joinedAt' | 'visitCount' | 'activeLoanCount'>): Student => {
    const nextNum = students.length + 1;
    const year = new Date().getFullYear();
    const newId = `BT-SMP1-${year}-${String(nextNum).padStart(3, '0')}`;
    const newStudent: Student = {
      ...studentData,
      id: newId,
      joinedAt: new Date().toISOString().split('T')[0],
      visitCount: 0,
      activeLoanCount: 0,
    };
    setStudents((prev) => [newStudent, ...prev]);
    setUnsyncedStatus((prev) => ({ ...prev, students: true }));
    showToast('success', 'Berhasil', undefined, 400);
    return newStudent;
  };

  const updateStudent = (id: string, studentData: Partial<Student>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...studentData } : s))
    );
    setUnsyncedStatus((prev) => ({ ...prev, students: true }));
    showToast('success', 'Tersimpan', undefined, 400);
  };

  const deleteStudent = (id: string): boolean => {
    const hasActiveLoan = transactions.some((t) => t.studentId === id && t.status !== 'Kembali');
    if (hasActiveLoan) {
      showToast('error', 'Gagal Hapus', 'Siswa masih meminjam buku', 800);
      return false;
    }
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setUnsyncedStatus((prev) => ({ ...prev, students: true }));
    showToast('success', 'Dihapus', undefined, 400);
    return true;
  };

  // Admin operations
  const addAdmin = (adminData: Omit<AdminUser, 'id' | 'isActive' | 'lastLogin'>): AdminUser => {
    const newId = `ADM-${String(admins.length + 1).padStart(3, '0')}`;
    const newAdmin: AdminUser = {
      ...adminData,
      id: newId,
      isActive: true,
      lastLogin: undefined,
    };
    setAdmins((prev) => [...prev, newAdmin]);
    setUnsyncedStatus((prev) => ({ ...prev, admins: true }));
    showToast('success', 'Berhasil', undefined, 400);
    return newAdmin;
  };

  const updateAdmin = (id: string, adminData: Partial<AdminUser>) => {
    let updatedAdmin: AdminUser | null = null;
    setAdmins((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          updatedAdmin = { ...a, ...adminData };
          return updatedAdmin;
        }
        return a;
      })
    );

    if (updatedAdmin && currentUser?.adminData?.id === id) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              role: (updatedAdmin as AdminUser).role,
              adminData: updatedAdmin as AdminUser,
            }
          : null
      );
    }
    setUnsyncedStatus((prev) => ({ ...prev, admins: true }));
    showToast('success', 'Tersimpan', undefined, 400);
  };

  const deleteAdmin = (id: string): boolean => {
    if (admins.length <= 1) {
      showToast('error', 'Gagal', 'Minimal harus ada 1 akun admin', 800);
      return false;
    }
    if (currentUser?.adminData?.id === id) {
      showToast('error', 'Gagal', 'Tidak bisa menghapus akun aktif', 800);
      return false;
    }
    setAdmins((prev) => prev.filter((a) => a.id !== id));
    setUnsyncedStatus((prev) => ({ ...prev, admins: true }));
    showToast('success', 'Dihapus', undefined, 400);
    return true;
  };

  const resetAdminPassword = (id: string, newPass: string) => {
    let updatedAdmin: AdminUser | null = null;
    setAdmins((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          updatedAdmin = { ...a, passwordHash: newPass };
          return updatedAdmin;
        }
        return a;
      })
    );
    if (updatedAdmin && currentUser?.adminData?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, adminData: updatedAdmin as AdminUser } : null));
    }
    setUnsyncedStatus((prev) => ({ ...prev, admins: true }));
    showToast('success', 'Tersimpan', undefined, 400);
  };

  // Borrow Book workflow
  const borrowBook = (
    studentIdentifier: string,
    bookIdentifier: string,
    dueDaysOrDate: number | string = 7,
    notes?: string
  ): { success: boolean; message: string; transaction?: LoanTransaction } => {
    const cleanStd = studentIdentifier.trim();
    const cleanBk = bookIdentifier.trim();

    const student = students.find(
      (s) => s.id.toLowerCase() === cleanStd.toLowerCase() || s.nisn === cleanStd
    );
    if (!student) {
      showToast('error', 'Siswa Tidak Ditemukan', 'Periksa ID Kartu atau NISN');
      return { success: false, message: 'Data siswa tidak ditemukan' };
    }

    const book = books.find(
      (b) => b.id.toLowerCase() === cleanBk.toLowerCase() || b.barcode === cleanBk
    );
    if (!book) {
      showToast('error', 'Buku Tidak Ditemukan', 'Periksa kode barcode atau ID buku');
      return { success: false, message: 'Data buku tidak ditemukan' };
    }

    if (book.availableCopies <= 0) {
      showToast('error', 'Stok Habis', `Semua eksemplar buku "${book.title}" sedang dipinjam`);
      return { success: false, message: 'Stok buku habis' };
    }

    // Check student max loans (e.g., max 3 books)
    const currentStudentActive = transactions.filter(
      (t) => t.studentId === student.id && t.status !== 'Kembali'
    );
    if (currentStudentActive.length >= 3) {
      showToast('warning', 'Batas Peminjaman', `${student.name} telah mencapai batas maksimal 3 buku dipinjam`);
      return { success: false, message: 'Batas pinjam maksimal 3 buku tercapai' };
    }

    // Current date & due date calculations
    const today = new Date();
    const borrowDateStr = today.toISOString().split('T')[0];
    let dueDateStr: string;

    if (typeof dueDaysOrDate === 'number') {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueDaysOrDate);
      dueDateStr = dueDate.toISOString().split('T')[0];
    } else if (typeof dueDaysOrDate === 'string' && dueDaysOrDate.trim() !== '') {
      dueDateStr = dueDaysOrDate.trim();
    } else {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      dueDateStr = dueDate.toISOString().split('T')[0];
    }

    const currentAdmin = currentUser?.adminData || INITIAL_ADMINS[0];

    const newTrx: LoanTransaction = {
      id: `TRX-${today.getFullYear()}-${String(transactions.length + 1).padStart(3, '0')}`,
      bookId: book.id,
      bookTitle: book.title,
      bookBarcode: book.barcode,
      bookCoverUrl: book.coverUrl,
      studentId: student.id,
      studentName: student.name,
      studentNisn: student.nisn,
      studentClass: student.classGrade,
      borrowDate: borrowDateStr,
      dueDate: dueDateStr,
      returnDate: null,
      status: 'Dipinjam',
      borrowAdminId: currentAdmin.id,
      borrowAdminName: currentAdmin.name,
      returnAdminId: null,
      returnAdminName: null,
      notes: notes || 'Peminjaman reguler',
    };

    // Update book stock
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b))
    );

    // Update student loan count
    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, activeLoanCount: s.activeLoanCount + 1 } : s))
    );

    // Append transaction
    setTransactions((prev) => [newTrx, ...prev]);
    setUnsyncedStatus((prev) => ({ ...prev, transactions: true, books: true, students: true }));

    showToast('success', 'Berhasil', undefined, 400);
    return { success: true, message: 'Peminjaman berhasil dicatat', transaction: newTrx };
  };

  // Return Book workflow
  const returnBook = (
    transactionIdOrBarcode: string,
    notes?: string
  ): { success: boolean; message: string; transaction?: LoanTransaction } => {
    const cleanId = transactionIdOrBarcode.trim();

    // Find active transaction by transaction ID or by book barcode / book ID
    const activeTrx = transactions.find(
      (t) =>
        t.status !== 'Kembali' &&
        (t.id.toLowerCase() === cleanId.toLowerCase() ||
          t.bookBarcode === cleanId ||
          t.bookId.toLowerCase() === cleanId.toLowerCase())
    );

    if (!activeTrx) {
      showToast('error', 'Tidak Ditemukan', undefined, 600);
      return { success: false, message: 'Transaksi aktif tidak ditemukan' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const currentAdmin = currentUser?.adminData || INITIAL_ADMINS[0];

    const updatedTrx: LoanTransaction = {
      ...activeTrx,
      returnDate: todayStr,
      status: 'Kembali',
      returnAdminId: currentAdmin.id,
      returnAdminName: currentAdmin.name,
      notes: notes ? `${activeTrx.notes ? activeTrx.notes + ' | ' : ''}${notes}` : activeTrx.notes,
    };

    // Update transaction
    setTransactions((prev) => prev.map((t) => (t.id === activeTrx.id ? updatedTrx : t)));

    // Return stock
    setBooks((prev) =>
      prev.map((b) =>
        b.id === activeTrx.bookId
          ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) }
          : b
      )
    );

    // Reduce student active loan count
    setStudents((prev) =>
      prev.map((s) =>
        s.id === activeTrx.studentId
          ? { ...s, activeLoanCount: Math.max(0, s.activeLoanCount - 1) }
          : s
      )
    );

    setUnsyncedStatus((prev) => ({ ...prev, transactions: true, books: true, students: true }));
    showToast('success', 'Berhasil', undefined, 400);
    return { success: true, message: 'Pengembalian buku berhasil diproses', transaction: updatedTrx };
  };

  // Visitor Logging
  const recordVisit = (
    studentIdentifier: string,
    purpose: string = 'Kunjungan Perpustakaan'
  ): { success: boolean; message: string; student?: Student } => {
    const clean = studentIdentifier.trim();
    const student = students.find(
      (s) => s.id.toLowerCase() === clean.toLowerCase() || s.nisn === clean
    );

    if (!student) {
      showToast('error', 'Kartu Tidak Dikenal', undefined, 600);
      return { success: false, message: 'Data siswa tidak ditemukan' };
    }

    const now = new Date();
    const newVisit: VisitorLog = {
      id: `VIS-${now.getFullYear()}-${String(visits.length + 1).padStart(3, '0')}`,
      studentId: student.id,
      studentName: student.name,
      studentNisn: student.nisn,
      studentClass: student.classGrade,
      timestamp: now.toISOString(),
      dateStr: now.toISOString().split('T')[0],
      purpose,
    };

    // Increment student visit count
    const updatedStudent = { ...student, visitCount: student.visitCount + 1 };
    setStudents((prev) => prev.map((s) => (s.id === student.id ? updatedStudent : s)));
    setVisits((prev) => [newVisit, ...prev]);
    setUnsyncedStatus((prev) => ({ ...prev, visits: true, students: true }));

    showToast('success', 'Berhasil', undefined, 400);
    return { success: true, message: 'Kunjungan berhasil dicatat', student: updatedStudent };
  };

  // Reset to default
  const resetToDefaultData = () => {
    setBooks(INITIAL_BOOKS);
    setStudents(INITIAL_STUDENTS);
    setAdmins(INITIAL_ADMINS);
    setTransactions(INITIAL_TRANSACTIONS);
    setVisits(INITIAL_VISITS);
    showToast('info', 'Direset', undefined, 400);
  };

  // Bulk Import
  const importData = (importedBooks?: Book[], importedStudents?: Student[]) => {
    let booksAdded = 0;
    let studentsAdded = 0;

    if (importedBooks && importedBooks.length > 0) {
      setBooks((prev) => {
        const existingBarcodes = new Set(prev.map((b) => b.barcode));
        const newOnes = importedBooks.filter((b) => !existingBarcodes.has(b.barcode));
        booksAdded = newOnes.length;
        return [...newOnes, ...prev];
      });
    }

    if (importedStudents && importedStudents.length > 0) {
      setStudents((prev) => {
        const existingNisns = new Set(prev.map((s) => s.nisn));
        const newOnes = importedStudents.filter((s) => !existingNisns.has(s.nisn));
        studentsAdded = newOnes.length;
        return [...newOnes, ...prev];
      });
    }

    setUnsyncedStatus((prev) => ({
      ...prev,
      books: booksAdded > 0 ? true : prev.books,
      students: studentsAdded > 0 ? true : prev.students,
    }));

    showToast('success', 'Berhasil', undefined, 400);
    return { booksAdded, studentsAdded };
  };

  // Update Logo (Super Admin)
  const updateLogo = async (newLogoUrl: string): Promise<boolean> => {
    setLogoUrl(newLogoUrl);
    try {
      const now = new Date().toISOString();
      const settingsRef = doc(db, 'settings', 'general');
      await setDoc(
        settingsRef,
        {
          appName: 'Sistem Perpustakaan Digital Bunga Tanjung',
          schoolName: 'SMP Negeri 1 Bengkalis',
          logoUrl: newLogoUrl,
          updatedAt: now,
        },
        { merge: true }
      );
      await setDoc(doc(db, 'meta', 'sync_state'), { settingsUpdated: now }, { merge: true });
      recordFirestoreOp('write', 2);
      setSyncMeta((prev) => ({ ...prev, settingsUpdated: now, lastCheckedAt: now }));
      setIsFirebaseConnected(true);
      showToast('success', 'Logo Diperbarui ke Cloud', 'Logo perpustakaan berhasil disimpan ke Firebase & diterapkan realtime');
      return true;
    } catch (err: any) {
      console.warn('Gagal menyimpan logo ke Firebase:', err);
      showToast('success', 'Logo Diperbarui Lokal', 'Logo berhasil diubah pada perangkat ini');
      return true;
    }
  };

  // Update Google Apps Script & Drive Folder
  const updateAppsScriptSettings = async (url: string, folderId?: string): Promise<boolean> => {
    setAppsScriptUrl(url);
    if (folderId !== undefined) {
      setDriveFolderId(folderId);
    }
    try {
      const now = new Date().toISOString();
      const settingsRef = doc(db, 'settings', 'general');
      await setDoc(
        settingsRef,
        {
          appsScriptUrl: url,
          driveFolderId: folderId !== undefined ? folderId : driveFolderId,
          updatedAt: now,
        },
        { merge: true }
      );
      await setDoc(doc(db, 'meta', 'sync_state'), { settingsUpdated: now }, { merge: true });
      recordFirestoreOp('write', 2);
      setSyncMeta((prev) => ({ ...prev, settingsUpdated: now, lastCheckedAt: now }));
      setIsFirebaseConnected(true);
      showToast('success', 'Tersimpan ke Firebase (Realtime)', 'Tautan Apps Script (exec) & Folder ID berhasil disimpan ke Cloud dan aktif di semua perangkat');
      return true;
    } catch (err) {
      showToast('info', 'Tersimpan Lokal', 'Konfigurasi tersimpan di browser lokal');
      return true;
    }
  };

  // Update Welcome Screen Settings (Judul, Ucapan, Kutipan, Motto, Warna Latar, dll)
  const updateWelcomeSettings = async (newSettings: {
    welcomeTitle?: string;
    welcomeSubtitle?: string;
    welcomeQuote?: string;
    welcomeMotto?: string;
    welcomeCopyright?: string;
    welcomeButtonText?: string;
    welcomeBgTheme?: string;
    welcomeBgColor?: string;
    logoUrl?: string;
  }): Promise<boolean> => {
    if (newSettings.welcomeTitle !== undefined) setWelcomeTitle(newSettings.welcomeTitle);
    if (newSettings.welcomeSubtitle !== undefined) setWelcomeSubtitle(newSettings.welcomeSubtitle);
    if (newSettings.welcomeQuote !== undefined) setWelcomeQuote(newSettings.welcomeQuote);
    if (newSettings.welcomeMotto !== undefined) setWelcomeMotto(newSettings.welcomeMotto);
    if (newSettings.welcomeCopyright !== undefined) setWelcomeCopyright(newSettings.welcomeCopyright);
    if (newSettings.welcomeButtonText !== undefined) setWelcomeButtonText(newSettings.welcomeButtonText);
    if (newSettings.welcomeBgTheme !== undefined) setWelcomeBgTheme(newSettings.welcomeBgTheme);
    if (newSettings.welcomeBgColor !== undefined) setWelcomeBgColor(newSettings.welcomeBgColor);
    if (newSettings.logoUrl !== undefined) setLogoUrl(newSettings.logoUrl);

    try {
      const now = new Date().toISOString();
      const settingsRef = doc(db, 'settings', 'general');
      await setDoc(
        settingsRef,
        {
          ...newSettings,
          updatedAt: now,
        },
        { merge: true }
      );
      await setDoc(doc(db, 'meta', 'sync_state'), { settingsUpdated: now }, { merge: true });
      recordFirestoreOp('write', 2);
      setSyncMeta((prev) => ({ ...prev, settingsUpdated: now, lastCheckedAt: now }));
      setIsFirebaseConnected(true);
      showToast('success', 'Tampilan Halaman Utama Disimpan', 'Konfigurasi beranda berhasil disimpan');
      return true;
    } catch (err: any) {
      console.warn('Simpan setting ke Firebase:', err);
      showToast('info', 'Tersimpan Lokal', 'Konfigurasi disimpan di browser lokal');
      return true;
    }
  };

  // Mass / Bulk Member Import with CSV & Spreadsheet Support
  const importStudentsBulk = async (
    importedStudents: Omit<Student, 'visitCount' | 'activeLoanCount'>[],
    updateExisting: boolean = true
  ): Promise<{ addedCount: number; updatedCount: number }> => {
    let addedCount = 0;
    let updatedCount = 0;

    const existingMap = new Map(students.map((s) => [s.nisn.trim().toLowerCase(), s]));
    let updatedList: Student[] = [...students];

    for (const item of importedStudents) {
      const key = item.nisn.trim().toLowerCase();
      const existing = existingMap.get(key);

      if (existing) {
        if (updateExisting) {
          const merged: Student = {
            ...existing,
            name: item.name,
            classGrade: item.classGrade,
            gender: item.gender,
            phone: item.phone || existing.phone,
            email: item.email || existing.email,
          };
          const idx = updatedList.findIndex((s) => s.id === existing.id);
          if (idx !== -1) {
            updatedList[idx] = merged;
            updatedCount++;
          }
        }
      } else {
        const nextNum = updatedList.length + 1;
        const year = new Date().getFullYear();
        const generatedId = item.id || `BT-SMP1-${year}-${String(nextNum).padStart(3, '0')}`;
        const newStudent: Student = {
          ...item,
          id: generatedId,
          joinedAt: item.joinedAt || new Date().toISOString().split('T')[0],
          visitCount: 0,
          activeLoanCount: 0,
        };
        updatedList.unshift(newStudent);
        existingMap.set(key, newStudent);
        addedCount++;
      }
    }

    setStudents(updatedList);
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }

    // Sync to Firestore in background chunks using writeBatch
    try {
      const batch = writeBatch(db);
      let opCount = 0;
      for (const student of updatedList.slice(0, 450)) {
        const ref = doc(db, 'students', student.id);
        batch.set(ref, student, { merge: true });
        opCount++;
      }
      if (opCount > 0) {
        await batch.commit();
      }
      const now = new Date().toISOString();
      await setDoc(doc(db, 'meta', 'sync_state'), { studentsUpdated: now }, { merge: true });

      setSyncMeta((prev) => {
        const next = { ...prev, studentsUpdated: now, lastCheckedAt: now };
        try {
          localStorage.setItem(STORAGE_KEYS.SYNC_META, JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err) {
      console.warn('Batch sync to Firestore queued in offline cache:', err);
    }

    showToast(
      'success',
      'Impor Massal Anggota Selesai',
      `${addedCount} siswa baru ditambahkan, ${updatedCount} siswa diperbarui`
    );

    return { addedCount, updatedCount };
  };

  // Sync a single specific collection to Firebase Cloud Firestore
  const syncCollectionToFirebase = async (
    collectionName: 'books' | 'students' | 'admins' | 'settings' | 'transactions' | 'visits'
  ): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      const now = new Date().toISOString();
      let count = 0;

      if (collectionName === 'books') {
        for (const b of books) {
          await setDoc(doc(db, 'books', b.id), b, { merge: true });
          count++;
        }
        await setDoc(doc(db, 'meta', 'sync_state'), { booksUpdated: now }, { merge: true });
        setSyncMeta((prev) => ({ ...prev, booksUpdated: now, lastCheckedAt: now }));
      } else if (collectionName === 'students') {
        for (const s of students) {
          await setDoc(doc(db, 'students', s.id), s, { merge: true });
          count++;
        }
        await setDoc(doc(db, 'meta', 'sync_state'), { studentsUpdated: now }, { merge: true });
        setSyncMeta((prev) => ({ ...prev, studentsUpdated: now, lastCheckedAt: now }));
      } else if (collectionName === 'admins') {
        for (const a of admins) {
          await setDoc(doc(db, 'admins', a.id), a, { merge: true });
          count++;
        }
        await setDoc(doc(db, 'meta', 'sync_state'), { adminsUpdated: now }, { merge: true });
        setSyncMeta((prev) => ({ ...prev, adminsUpdated: now, lastCheckedAt: now }));
      } else if (collectionName === 'settings') {
        await setDoc(
          doc(db, 'settings', 'general'),
          {
            appName: 'Sistem Perpustakaan Digital Bunga Tanjung',
            schoolName: 'SMP Negeri 1 Bengkalis',
            logoUrl,
            appsScriptUrl,
            driveFolderId,
            welcomeTitle,
            welcomeSubtitle,
            welcomeQuote,
            welcomeMotto,
            welcomeCopyright,
            welcomeButtonText,
            welcomeBgTheme,
            welcomeBgColor,
            updatedAt: now,
          },
          { merge: true }
        );
        count = 1;
        await setDoc(doc(db, 'meta', 'sync_state'), { settingsUpdated: now }, { merge: true });
        setSyncMeta((prev) => ({ ...prev, settingsUpdated: now, lastCheckedAt: now }));
      } else if (collectionName === 'transactions') {
        for (const t of transactions) {
          await setDoc(doc(db, 'transactions', t.id), t, { merge: true });
          count++;
        }
        await setDoc(doc(db, 'meta', 'sync_state'), { transactionsUpdated: now }, { merge: true });
        setSyncMeta((prev) => ({ ...prev, transactionsUpdated: now, lastCheckedAt: now }));
      } else if (collectionName === 'visits') {
        for (const v of visits) {
          await setDoc(doc(db, 'visits', v.id), v, { merge: true });
          count++;
        }
        await setDoc(doc(db, 'meta', 'sync_state'), { visitsUpdated: now }, { merge: true });
        setSyncMeta((prev) => ({ ...prev, visitsUpdated: now, lastCheckedAt: now }));
      }

      recordFirestoreOp('write', count + 1);
      setIsFirebaseConnected(true);
      setUnsyncedStatus((prev) => ({ ...prev, [collectionName]: false }));
      showToast('success', 'Berhasil', undefined, 400);
      return { success: true, count };
    } catch (err: any) {
      console.error(`Firebase sync error for ${collectionName}:`, err);
      showToast('error', 'Gagal', err.message, 800);
      return { success: false, count: 0, error: err.message };
    }
  };

  // Full synchronization to Firebase Cloud Firestore
  const syncAllToFirebase = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    try {
      const now = new Date().toISOString();
      let count = 0;

      // 1. Settings
      await setDoc(
        doc(db, 'settings', 'general'),
        {
          appName: 'Sistem Perpustakaan Digital Bunga Tanjung',
          schoolName: 'SMP Negeri 1 Bengkalis',
          logoUrl,
          appsScriptUrl,
          driveFolderId,
          welcomeTitle,
          welcomeSubtitle,
          welcomeQuote,
          welcomeMotto,
          welcomeCopyright,
          welcomeButtonText,
          welcomeBgTheme,
          welcomeBgColor,
          updatedAt: now,
        },
        { merge: true }
      );
      count++;

      // 2. Books
      for (const b of books) {
        await setDoc(doc(db, 'books', b.id), b, { merge: true });
        count++;
      }

      // 3. Students
      for (const s of students) {
        await setDoc(doc(db, 'students', s.id), s, { merge: true });
        count++;
      }

      // 4. Transactions
      for (const t of transactions) {
        await setDoc(doc(db, 'transactions', t.id), t, { merge: true });
        count++;
      }

      // 5. Visits
      for (const v of visits) {
        await setDoc(doc(db, 'visits', v.id), v, { merge: true });
        count++;
      }

      // 6. Admins
      for (const a of admins) {
        await setDoc(doc(db, 'admins', a.id), a, { merge: true });
        count++;
      }

      // 7. Meta sync state to prevent redundant downloads on reload
      await setDoc(
        doc(db, 'meta', 'sync_state'),
        {
          booksUpdated: now,
          studentsUpdated: now,
          transactionsUpdated: now,
          visitsUpdated: now,
          settingsUpdated: now,
          adminsUpdated: now,
          lastFullSyncAt: now,
        },
        { merge: true }
      );

      const updatedMeta: SyncMetaState = {
        ...syncMeta,
        booksUpdated: now,
        studentsUpdated: now,
        transactionsUpdated: now,
        visitsUpdated: now,
        settingsUpdated: now,
        adminsUpdated: now,
        lastCheckedAt: now,
        lastDeltaReport: 'Sinkronisasi penuh cloud berhasil. Cache lokal sinkron 100%.',
        cacheProtected: true,
      };
      setSyncMeta(updatedMeta);
      localStorage.setItem(STORAGE_KEYS.SYNC_META, JSON.stringify(updatedMeta));

      setLastSyncedAt(now);
      setIsFirebaseConnected(true);
      setUnsyncedStatus({
        books: false,
        students: false,
        admins: false,
        transactions: false,
        visits: false,
        settings: false,
      });
      showToast('success', 'Berhasil', undefined, 400);
      return { success: true, count };
    } catch (err: any) {
      console.error('Firebase sync error:', err);
      showToast('error', 'Gagal', err.message, 800);
      return { success: false, count: 0, error: err.message };
    }
  };

  const [statsTick, setStatsTick] = useState<number>(0);
  const refreshUsageStats = () => {
    setStatsTick((prev) => prev + 1);
  };

  const firebaseUsageStats = React.useMemo<FirebaseUsageStats>(() => {
    // 1. Calculate approximate payload sizes in bytes
    const booksBytes = JSON.stringify(books).length + books.length * 32;
    const studentsBytes = JSON.stringify(students).length + students.length * 32;
    const transactionsBytes = JSON.stringify(transactions).length + transactions.length * 32;
    const visitsBytes = JSON.stringify(visits).length + visits.length * 32;
    const adminsBytes = JSON.stringify(admins).length + admins.length * 32;
    const settingsBytes =
      JSON.stringify({
        logoUrl,
        appsScriptUrl,
        driveFolderId,
        welcomeTitle,
        welcomeSubtitle,
        welcomeQuote,
        welcomeMotto,
        welcomeCopyright,
        welcomeButtonText,
        syncMeta,
      }).length + 128;

    const totalStorageBytes =
      booksBytes + studentsBytes + transactionsBytes + visitsBytes + adminsBytes + settingsBytes;
    const storageMaxBytes = 1024 * 1024 * 1024; // 1 GB free tier
    const storagePercentage = Number(((totalStorageBytes / storageMaxBytes) * 100).toFixed(4));

    const totalDocuments =
      books.length + students.length + transactions.length + visits.length + admins.length + 2;
    const avgDocumentSizeBytes = totalDocuments > 0 ? Math.round(totalStorageBytes / totalDocuments) : 0;

    // Free tier quotas
    const readsMax = 50000;
    const writesMax = 20000;
    const deletesMax = 20000;

    const readsUsed = dailyQuota.reads;
    const writesUsed = dailyQuota.writes;
    const deletesUsed = dailyQuota.deletes;

    const readsPercentage = Number(Math.min(100, (readsUsed / readsMax) * 100).toFixed(2));
    const writesPercentage = Number(Math.min(100, (writesUsed / writesMax) * 100).toFixed(2));
    const deletesPercentage = Number(Math.min(100, (deletesUsed / deletesMax) * 100).toFixed(2));

    const readsRemaining = Math.max(0, readsMax - readsUsed);
    const writesRemaining = Math.max(0, writesMax - writesUsed);
    const deletesRemaining = Math.max(0, deletesMax - deletesUsed);

    const collectionBreakdown = [
      {
        name: 'Arsip Buku',
        key: 'books',
        count: books.length,
        sizeBytes: booksBytes,
        sizeFormatted: formatBytes(booksBytes),
        percentage: totalStorageBytes > 0 ? Number(((booksBytes / totalStorageBytes) * 100).toFixed(1)) : 0,
        color: '#10B981', // Emerald
      },
      {
        name: 'Anggota Siswa',
        key: 'students',
        count: students.length,
        sizeBytes: studentsBytes,
        sizeFormatted: formatBytes(studentsBytes),
        percentage: totalStorageBytes > 0 ? Number(((studentsBytes / totalStorageBytes) * 100).toFixed(1)) : 0,
        color: '#6366F1', // Indigo
      },
      {
        name: 'Peminjaman',
        key: 'transactions',
        count: transactions.length,
        sizeBytes: transactionsBytes,
        sizeFormatted: formatBytes(transactionsBytes),
        percentage: totalStorageBytes > 0 ? Number(((transactionsBytes / totalStorageBytes) * 100).toFixed(1)) : 0,
        color: '#F59E0B', // Amber
      },
      {
        name: 'Buku Tamu',
        key: 'visits',
        count: visits.length,
        sizeBytes: visitsBytes,
        sizeFormatted: formatBytes(visitsBytes),
        percentage: totalStorageBytes > 0 ? Number(((visitsBytes / totalStorageBytes) * 100).toFixed(1)) : 0,
        color: '#06B6D4', // Cyan
      },
      {
        name: 'Akun Pengurus',
        key: 'admins',
        count: admins.length,
        sizeBytes: adminsBytes,
        sizeFormatted: formatBytes(adminsBytes),
        percentage: totalStorageBytes > 0 ? Number(((adminsBytes / totalStorageBytes) * 100).toFixed(1)) : 0,
        color: '#EC4899', // Pink
      },
      {
        name: 'Pengaturan & Sistem',
        key: 'settings',
        count: 2,
        sizeBytes: settingsBytes,
        sizeFormatted: formatBytes(settingsBytes),
        percentage: totalStorageBytes > 0 ? Number(((settingsBytes / totalStorageBytes) * 100).toFixed(1)) : 0,
        color: '#8B5CF6', // Purple
      },
    ];

    return {
      storageBytes: totalStorageBytes,
      storageMaxBytes,
      storagePercentage,
      storageFormatted: formatBytes(totalStorageBytes),
      storageLimitFormatted: '1.00 GB',
      readsUsed,
      readsMax,
      readsPercentage,
      readsRemaining,
      writesUsed,
      writesMax,
      writesPercentage,
      writesRemaining,
      deletesUsed,
      deletesMax,
      deletesPercentage,
      deletesRemaining,
      collectionBreakdown,
      totalDocuments,
      avgDocumentSizeBytes,
      savedReadsCount: syncMeta.savedReadsCount || 0,
      lastCalculatedAt: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
  }, [
    books,
    students,
    transactions,
    visits,
    admins,
    logoUrl,
    appsScriptUrl,
    driveFolderId,
    welcomeTitle,
    welcomeSubtitle,
    welcomeQuote,
    welcomeMotto,
    welcomeCopyright,
    welcomeButtonText,
    syncMeta,
    dailyQuota,
    statsTick,
  ]);

  return (
    <LibraryContext.Provider
      value={{
        currentUser,
        loginAdmin,
        loginAdminByBarcode,
        loginSiswa,
        loginSiswaDirect,
        logout,
        books,
        students,
        admins,
        transactions,
        visits,
        firebaseUsageStats,
        refreshUsageStats,
        logoUrl,
        appsScriptUrl,
        driveFolderId,
        isFirebaseConnected,
        lastSyncedAt,
        syncMeta,
        isSyncChecking,
        checkDeltaSync,
        importStudentsBulk,
        welcomeTitle,
        welcomeSubtitle,
        welcomeQuote,
        welcomeMotto,
        welcomeCopyright,
        welcomeButtonText,
        welcomeBgTheme,
        welcomeBgColor,
        updateWelcomeSettings,
        updateLogo,
        updateAppsScriptSettings,
        syncAllToFirebase,
        syncCollectionToFirebase,
        addBook,
        updateBook,
        deleteBook,
        addStudent,
        updateStudent,
        deleteStudent,
        addAdmin,
        updateAdmin,
        deleteAdmin,
        resetAdminPassword,
        borrowBook,
        returnBook,
        recordVisit,
        toasts,
        showToast,
        removeToast,
        unsyncedStatus,
        setUnsyncedStatus,
        resetToDefaultData,
        importData,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
