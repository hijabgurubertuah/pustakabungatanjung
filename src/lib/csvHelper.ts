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
