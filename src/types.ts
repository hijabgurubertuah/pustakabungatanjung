export type UserRole = 'superadmin' | 'admin' | 'siswa';

export type BookCondition = 'Sangat Baik' | 'Baik' | 'Rusak Sedang' | 'Rusak Parah';

export interface Book {
  id: string; // e.g. "BK-001" or ISBN/Barcode
  barcode: string;
  title: string;
  author: string;
  publisher: string;
  category: string;
  publishYear: number;
  entryYear: number;
  totalCopies: number;
  availableCopies: number;
  condition: BookCondition;
  coverUrl: string;
  shelfLocation?: string;
  synopsis?: string;
  createdAt: string;
}

export interface Student {
  id: string; // Card ID e.g. "BT-SMP1-2024-001"
  nisn: string;
  name: string;
  classGrade: string; // e.g. "VII-A", "VIII-B", "IX-C"
  gender: 'L' | 'P';
  photoUrl: string;
  pob?: string; // Tempat Lahir
  dob?: string; // Tanggal Lahir (YYYY-MM-DD)
  drivePhotoUrl?: string; // Google Drive Photo URL
  cardDataCompleted?: boolean; // Indikator formulir data kartu sudah dilengkapi
  cardDataSubmittedAt?: string; // Tanggal melengkapi
  phone?: string;
  email?: string;
  joinedAt: string;
  visitCount: number;
  activeLoanCount: number;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  nipOrId: string;
  email: string;
  role: 'superadmin' | 'admin';
  avatarUrl?: string;
  isActive: boolean;
  passwordHash: string; // hashed/masked
  lastLogin?: string;
}

export interface LoanTransaction {
  id: string; // e.g. "TRX-2026-001"
  bookId: string;
  bookTitle: string;
  bookBarcode: string;
  bookCoverUrl?: string;
  studentId: string;
  studentName: string;
  studentNisn: string;
  studentClass: string;
  borrowDate: string; // ISO or YYYY-MM-DD
  dueDate: string; // ISO or YYYY-MM-DD
  returnDate?: string | null;
  status: 'Dipinjam' | 'Kembali' | 'Terlambat';
  borrowAdminId: string;
  borrowAdminName: string;
  returnAdminId?: string | null;
  returnAdminName?: string | null;
  notes?: string;
}

export interface VisitorLog {
  id: string;
  studentId: string;
  studentName: string;
  studentNisn: string;
  studentClass: string;
  timestamp: string; // ISO
  dateStr: string; // YYYY-MM-DD
  purpose?: string;
}

export interface LibraryStats {
  totalBooks: number;
  totalAvailableCopies: number;
  totalBorrowedCopies: number;
  totalStudents: number;
  totalVisitsThisMonth: number;
  todayVisits: number;
  activeLoans: number;
}

export interface LibrarySettings {
  appName: string;
  schoolName: string;
  logoUrl: string;
  appsScriptUrl: string;
  driveFolderId?: string;
  lastSyncedAt?: string;
  // Halaman Utama & Ucapan Selamat Datang
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeQuote: string;
  welcomeMotto: string;
  welcomeCopyright: string;
  welcomeButtonText: string;
  welcomeBgTheme?: string;
  welcomeBgColor?: string;
}

