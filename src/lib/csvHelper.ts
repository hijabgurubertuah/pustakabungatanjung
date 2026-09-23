import { Student } from '../types';

export const CSV_TEMPLATE_HEADERS = [
  'NISN / NIP',
  'Nama Lengkap',
  'Tipe (Siswa/Guru/Staf)',
  'Kelas / Jabatan',
  'Jenis Kelamin (L/P)',
  'No WhatsApp / HP',
  'Email',
];

export const CSV_SAMPLE_ROWS = [
  ['0081234567', 'Ahmad Fauzi Rahman', 'Siswa', 'VII-A', 'L', '081234567890', 'ahmad.fauzi@smpn1.sch.id'],
  ['0087654321', 'Siti Nurhaliza', 'Siswa', 'VII-B', 'P', '081398765432', 'siti.nur@smpn1.sch.id'],
  ['0085544332', 'Budi Pratama Santoso', 'Siswa', 'VIII-A', 'L', '085277889900', 'budi.p@smpn1.sch.id'],
  ['0089988776', 'Dewi Anggraini Lestari', 'Siswa', 'IX-B', 'P', '082133445566', 'dewi.lestari@smpn1.sch.id'],
  ['197805122005011003', 'Dra. Hj. Siti Aminah, M.Pd', 'Guru', 'Guru Bahasa Indonesia', 'P', '081277665544', 'siti.aminah@guru.belajar.id'],
  ['198503142010012008', 'Bambang Irawan, S.Kom', 'Staf', 'Staff Tata Usaha', 'L', '085211223344', 'bambang@staff.smpn1.id'],
];

/**
 * Downloads a pre-formatted CSV template with BOM for Excel/Sheets compatibility
 */
export function downloadMemberTemplateCSV(): void {
  const rows = [CSV_TEMPLATE_HEADERS, ...CSV_SAMPLE_ROWS];
  const csvContent =
    '\uFEFF' +
    rows
      .map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Template_Import_Anggota_Perpustakaan_SMPN1_${new Date().getFullYear()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copies the CSV template format to clipboard for quick paste into Excel / Sheets
 */
export async function copyTemplateToClipboard(): Promise<boolean> {
  const rows = [CSV_TEMPLATE_HEADERS, ...CSV_SAMPLE_ROWS];
  const text = rows.map((r) => r.join('\t')).join('\n');
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export interface ParsedMemberRow {
  index: number;
  nisn: string;
  name: string;
  memberType: 'Siswa' | 'Guru' | 'Staf';
  classGrade: string;
  gender: 'L' | 'P';
  phone: string;
  email: string;
  isValid: boolean;
  validationError?: string;
  isExisting?: boolean;
}

/**
 * Parse CSV / TSV text into validated member records
 * Handles comma, semicolon, and tab delimiters, plus quote encapsulation
 */
export function parseMemberCSV(rawText: string, existingStudents: Student[] = []): ParsedMemberRow[] {
  if (!rawText || !rawText.trim()) return [];

  // Split into lines
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return [];

  // Determine delimiter from the first line: comma, semicolon, or tab
  const firstLine = lines[0];
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  } else if (semicolonCount > commaCount) {
    delimiter = ';';
  }

  // Helper to split a CSV line respecting quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parsedRows: ParsedMemberRow[] = [];
  let startIndex = 0;

  // Check if first row is header
  const firstParsed = parseLine(firstLine).map((col) => col.toLowerCase());
  if (
    firstParsed.some(
      (c) =>
        c.includes('nisn') ||
        c.includes('nama') ||
        c.includes('name') ||
        c.includes('kelas') ||
        c.includes('tipe')
    )
  ) {
    startIndex = 1;
  }

  const existingNisns = new Set(existingStudents.map((s) => s.nisn.trim().toLowerCase()));

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;

    const cols = parseLine(rawLine);
    if (cols.length < 2) continue; // Not enough data

    const nisn = (cols[0] || '').replace(/['"]/g, '').trim();
    const name = (cols[1] || '').replace(/['"]/g, '').trim();
    const rawType = (cols[2] || '').replace(/['"]/g, '').trim().toLowerCase();
    const classGrade = (cols[3] || '').replace(/['"]/g, '').trim() || 'VII-A';
    const rawGender = (cols[4] || '').replace(/['"]/g, '').trim().toUpperCase();
    const phone = (cols[5] || '').replace(/['"]/g, '').trim();
    const email = (cols[6] || '').replace(/['"]/g, '').trim();

    let memberType: 'Siswa' | 'Guru' | 'Staf' = 'Siswa';
    if (rawType.includes('guru') || rawType.includes('pengajar')) memberType = 'Guru';
    else if (rawType.includes('staf') || rawType.includes('tu') || rawType.includes('karyawan')) memberType = 'Staf';

    let gender: 'L' | 'P' = 'L';
    if (rawGender === 'P' || rawGender.startsWith('PEREMPUAN') || rawGender.startsWith('WANITA')) {
      gender = 'P';
    }

    let isValid = true;
    let validationError = '';

    if (!name) {
      isValid = false;
      validationError = 'Nama wajib diisi';
    } else if (!nisn) {
      isValid = false;
      validationError = 'NISN / NIP wajib diisi';
    }

    const isExisting = Boolean(nisn && existingNisns.has(nisn.toLowerCase()));

    parsedRows.push({
      index: i + 1,
      nisn: nisn || `AUTO-${Math.floor(100000 + Math.random() * 900000)}`,
      name,
      memberType,
      classGrade,
      gender,
      phone,
      email,
      isValid,
      validationError,
      isExisting,
    });
  }

  return parsedRows;
}

// ============================================================================
// BOOK CSV & GOOGLE SPREADSHEET HELPER FUNCTIONS
// ============================================================================

export const BOOK_CSV_TEMPLATE_HEADERS = [
  'Barcode',
  'Judul Buku',
  'Pengarang',
  'Penerbit',
  'Kategori',
  'Tahun Terbit',
  'Tahun Masuk',
  'Jumlah Eksemplar',
  'Kondisi Fisik',
  'Lokasi Rak',
  'Sinopsis',
  'URL Sampul',
];

export const BOOK_SAMPLE_ROWS = [
  ['9786020332116', 'Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', 'Novel & Sastra', 2005, 2023, 10, 'Sangat Baik', 'Rak A1', 'Kisah perjuangan 10 anak Laskar Pelangi di Belitung.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80'],
  ['9789791227025', 'Bumi Manusia', 'Pramoedya Ananta Toer', 'Lentera Dipantara', 'Novel & Sastra', 1980, 2022, 5, 'Baik', 'Rak A2', 'Novel pencerahan kebangsaan awal abad ke-20.', 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&auto=format&fit=crop&q=80'],
  ['9786022914120', 'Ensiklopedia Sains & Teknologi', 'Tim LIPI', 'Penerbit Erlangga', 'Ensiklopedia & Referensi', 2018, 2024, 8, 'Baik', 'Rak B1', 'Panduan sains modern untuk siswa SMP.', 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&auto=format&fit=crop&q=80'],
  ['9786020633112', 'Matematika SMP Kelas VII', 'Kementerian Pendidikan', 'Kemdikbud RI', 'Buku Pelajaran', 2022, 2023, 25, 'Baik', 'Rak C1', 'Buku teks utama mata pelajaran Matematika Kurikulum Merdeka.', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&auto=format&fit=crop&q=80'],
];

export interface ParsedBookRow {
  index: number;
  barcode: string;
  title: string;
  author: string;
  publisher: string;
  category: string;
  publishYear: number;
  entryYear: number;
  totalCopies: number;
  condition: 'Sangat Baik' | 'Baik' | 'Rusak Sedang' | 'Rusak Parah';
  shelfLocation: string;
  synopsis: string;
  coverUrl: string;
  isValid: boolean;
  validationError?: string;
  isExisting?: boolean;
}

/**
 * Downloads a pre-formatted Book CSV template with BOM for Excel/Google Sheets compatibility
 */
export function downloadBookTemplateCSV(): void {
  const rows = [BOOK_CSV_TEMPLATE_HEADERS, ...BOOK_SAMPLE_ROWS];
  const csvContent =
    '\uFEFF' +
    rows
      .map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Template_Katalog_Buku_BungaTanjung_${new Date().getFullYear()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export books to CSV
 */
export function exportBooksToCSVFile(books: any[], filename?: string): void {
  const headers = BOOK_CSV_TEMPLATE_HEADERS;
  const rows = books.map((b) => [
    b.barcode,
    b.title,
    b.author,
    b.publisher,
    b.category,
    b.publishYear,
    b.entryYear,
    b.totalCopies,
    b.condition,
    b.shelfLocation || 'Rak A1',
    b.synopsis || '',
    b.coverUrl || '',
  ]);

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `Arsip_Buku_Perpustakaan_BungaTanjung_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV or TSV raw text into validated book items
 */
export function parseBookCSV(rawText: string, existingBooks: any[] = []): ParsedBookRow[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return [];

  const firstLine = lines[0];
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  } else if (semicolonCount > commaCount) {
    delimiter = ';';
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parsedRows: ParsedBookRow[] = [];
  let startIndex = 0;

  const firstParsed = parseLine(firstLine).map((col) => col.toLowerCase());
  if (
    firstParsed.some(
      (c) =>
        c.includes('barcode') ||
        c.includes('judul') ||
        c.includes('title') ||
        c.includes('pengarang') ||
        c.includes('author') ||
        c.includes('penerbit')
    )
  ) {
    startIndex = 1;
  }

  const existingBarcodes = new Set(existingBooks.map((b) => String(b.barcode).trim().toLowerCase()));

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;

    const cols = parseLine(rawLine);
    if (cols.length < 2) continue;

    const rawBarcode = (cols[0] || '').replace(/['"]/g, '').trim();
    const title = (cols[1] || '').replace(/['"]/g, '').trim();
    const author = (cols[2] || '').replace(/['"]/g, '').trim() || 'Anonim';
    const publisher = (cols[3] || '').replace(/['"]/g, '').trim() || 'Perpustakaan Sekolah';
    const category = (cols[4] || '').replace(/['"]/g, '').trim() || 'Buku Pelajaran';
    const publishYear = parseInt((cols[5] || '').replace(/\D/g, ''), 10) || new Date().getFullYear();
    const entryYear = parseInt((cols[6] || '').replace(/\D/g, ''), 10) || new Date().getFullYear();
    const totalCopies = parseInt((cols[7] || '').replace(/\D/g, ''), 10) || 1;
    const rawCondition = (cols[8] || '').replace(/['"]/g, '').trim();
    const shelfLocation = (cols[9] || '').replace(/['"]/g, '').trim() || 'Rak A1';
    const synopsis = (cols[10] || '').replace(/['"]/g, '').trim() || '';
    const coverUrl = (cols[11] || '').replace(/['"]/g, '').trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80';

    let condition: 'Sangat Baik' | 'Baik' | 'Rusak Sedang' | 'Rusak Parah' = 'Baik';
    if (rawCondition.toLowerCase().includes('sangat')) condition = 'Sangat Baik';
    else if (rawCondition.toLowerCase().includes('rusak sedang')) condition = 'Rusak Sedang';
    else if (rawCondition.toLowerCase().includes('rusak parah')) condition = 'Rusak Parah';

    const barcode = rawBarcode || `978${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    let isValid = true;
    let validationError = '';

    if (!title) {
      isValid = false;
      validationError = 'Judul buku wajib diisi';
    }

    const isExisting = Boolean(rawBarcode && existingBarcodes.has(rawBarcode.toLowerCase()));

    parsedRows.push({
      index: i + 1,
      barcode,
      title,
      author,
      publisher,
      category,
      publishYear,
      entryYear,
      totalCopies: Math.max(1, totalCopies),
      condition,
      shelfLocation,
      synopsis,
      coverUrl,
      isValid,
      validationError,
      isExisting,
    });
  }

  return parsedRows;
}

/**
 * Fetch and parse CSV directly from a Google Sheets published CSV URL
 */
export async function fetchGoogleSheetsCSV(csvUrl: string): Promise<string> {
  let targetUrl = csvUrl.trim();
  
  // Transform standard Google Sheets view URL into published CSV URL if needed
  if (targetUrl.includes('docs.google.com/spreadsheets/d/')) {
    if (!targetUrl.includes('pub?output=csv') && !targetUrl.includes('/export?format=csv')) {
      const match = targetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const spreadsheetId = match[1];
        targetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/pub?output=csv`;
      }
    }
  }

  const response = await fetch(targetUrl);
  if (!response.ok) {
    throw new Error(`Gagal mengunduh data dari Google Sheets (HTTP ${response.status})`);
  }

  const csvText = await response.text();
  return csvText;
}

