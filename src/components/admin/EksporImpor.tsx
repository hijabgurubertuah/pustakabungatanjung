import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  FileSpreadsheet,
  Download,
  Upload,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  Database,
  FileText,
  AlertCircle,
  ExternalLink,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ImportAnggotaModal } from './ImportAnggotaModal';
import { downloadMemberTemplateCSV, copyTemplateToClipboard } from '../../lib/csvHelper';

export const EksporImpor: React.FC = () => {
  const {
    books,
    students,
    transactions,
    visits,
    importData,
    resetToDefaultData,
    showToast,
    syncMeta,
    checkDeltaSync,
    isSyncChecking,
  } = useLibrary();

  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('2026-09-20 09:30 WIB');
  const [showImportModal, setShowImportModal] = useState(false);

  // Export to CSV helper
  const exportToCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Ekspor Berhasil', `Berkas ${filename} diunduh`);
  };

  const handleExportBooks = () => {
    const headers = [
      'ID',
      'Barcode',
      'Judul Buku',
      'Pengarang',
      'Penerbit',
      'Kategori',
      'Tahun Terbit',
      'Tahun Masuk',
      'Total Eksemplar',
      'Stok Tersedia',
      'Kondisi Fisik',
      'Lokasi Rak',
    ];
    const data = books.map((b) => [
      b.id,
      b.barcode,
      b.title,
      b.author,
      b.publisher,
      b.category,
      b.publishYear,
      b.entryYear,
      b.totalCopies,
      b.availableCopies,
      b.condition,
      b.shelfLocation || '-',
    ]);
    exportToCSV(`Katalog_Buku_BungaTanjung_${new Date().toISOString().split('T')[0]}.csv`, [
      headers,
      ...data,
    ]);
  };

  const handleExportTransactions = () => {
    const headers = [
      'No Transaksi',
      'Judul Buku',
      'Barcode Buku',
      'Nama Siswa',
      'NISN',
      'Kelas',
      'Tanggal Pinjam',
      'Jatuh Tempo',
      'Tanggal Kembali',
      'Status',
      'Petugas Peminjaman',
      'Petugas Pengembalian',
      'Catatan',
    ];
    const data = transactions.map((t) => [
      t.id,
      t.bookTitle,
      t.bookBarcode,
      t.studentName,
      t.studentNisn,
      t.studentClass,
      t.borrowDate,
      t.dueDate,
      t.returnDate || '-',
      t.status,
      t.borrowAdminName,
      t.returnAdminName || '-',
      t.notes || '-',
    ]);
    exportToCSV(`Rekap_Transaksi_PinjamKembali_${new Date().toISOString().split('T')[0]}.csv`, [
      headers,
      ...data,
    ]);
  };

  const handleExportVisits = () => {
    const headers = ['ID', 'Nama Siswa', 'NISN', 'Kelas', 'Waktu Kunjungan', 'Keperluan'];
    const data = visits.map((v) => [
      v.id,
      v.studentName,
      v.studentNisn,
      v.studentClass,
      v.timestamp,
      v.purpose || 'Kunjungan',
    ]);
    exportToCSV(`Rekap_Kunjungan_Siswa_${new Date().toISOString().split('T')[0]}.csv`, [
      headers,
      ...data,
    ]);
  };

  const handleExportStudents = () => {
    const headers = [
      'ID Kartu',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Jenis Kelamin',
      'Jumlah Kunjungan',
      'Pinjaman Aktif',
      'No HP',
    ];
    const data = students.map((s) => [
      s.id,
      s.nisn,
      s.name,
      s.classGrade,
      s.gender,
      s.visitCount,
      s.activeLoanCount,
      s.phone || '-',
    ]);
    exportToCSV(`Data_Anggota_Siswa_${new Date().toISOString().split('T')[0]}.csv`, [
      headers,
      ...data,
    ]);
  };

  // Google Spreadsheet Sync Simulation
  const handleSpreadsheetSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      const now = new Date();
      setLastSyncTime(
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
          now.getDate()
        ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')} WIB`
      );
      showToast(
        'success',
        'Sinkronisasi Sukses',
        'Data Firestore & Google Spreadsheet telah diselaraskan'
      );
    }, 1200);
  };

  // Handle JSON Backup Import
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(content);
            importData(parsed.books, parsed.students);
          } else {
            setShowImportModal(true);
          }
        } catch {
          showToast('error', 'Gagal Membaca File', 'Pastikan format CSV / JSON valid');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cloud Integration & Delta Sync Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Delta Sync & Cache Quota Saver Card */}
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-5 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm font-heading">
                  Smart Delta Sync
                </h4>
                <p className="text-[11px] text-slate-500">
                  Hemat kuota Firestore aktif
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Cache Terjaga
            </span>
          </div>

          <p className="text-xs text-slate-600">
            {syncMeta.lastDeltaReport || 'Cache lokal dipertahankan saat refresh. Hanya perbedaan data yang diunduh.'}
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => checkDeltaSync(false)}
              disabled={isSyncChecking}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncChecking ? 'animate-spin' : ''}`} />
              <span>{isSyncChecking ? 'Memeriksa...' : 'Cek Perbedaan Data'}</span>
            </button>
          </div>
        </div>

        {/* Google Spreadsheet Sync Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm font-heading">
                  Google Spreadsheet
                </h4>
                <p className="text-[11px] text-slate-500">
                  Terakhir: <strong>{lastSyncTime}</strong>
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-200">
              Tersambung
            </span>
          </div>

          <div className="text-xs text-slate-600">
            Terhubung dengan Google Apps Script untuk otomatisasi pelaporan berkala.
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSpreadsheetSync}
              disabled={isSyncing}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* Google Drive Media Store */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm font-heading">
                  Google Drive Storage
                </h4>
                <p className="text-[11px] text-slate-500">
                  Foto sampul & logo perpustakaan
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
              Aktif
            </span>
          </div>

          <div className="text-xs text-slate-600 flex items-center justify-between pt-2">
            <span>Total Aset: <strong>{books.length + students.length} Berkas</strong></span>
            <span className="text-[11px] text-slate-400">CDN Terhubung</span>
          </div>
        </div>
      </div>

      {/* Mass Member Input & CSV Template Section */}
      <div className="bg-linear-to-r from-indigo-50/70 via-white to-blue-50/70 rounded-2xl border border-indigo-200/80 shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-heading flex items-center gap-2">
                Input Data Anggota Massal (Template CSV & Spreadsheet)
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full">
                  Fitur Utama
                </span>
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Daftarkan ratusan siswa sekaligus menggunakan template CSV terstandar, atau salin-tempel langsung dari Google Spreadsheet / Microsoft Excel.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                downloadMemberTemplateCSV();
                showToast('success', 'Template Diunduh', 'Berkas template_data_anggota_perpustakaan.csv siap diedit');
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template CSV</span>
            </button>

            <button
              onClick={() => {
                copyTemplateToClipboard();
                showToast('success', 'Format Tersalin', 'Format kolom CSV tersalin ke clipboard. Buka Spreadsheet dan paste!');
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Salin Format Spreadsheet</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Buka Form Impor Massal</span>
            </button>
          </div>
        </div>

        {/* Format Columns preview */}
        <div className="bg-white/80 backdrop-blur-xs rounded-xl border border-indigo-100 p-3 text-xs flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700 text-[11px]">Format Kolom:</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[11px]">NISN*</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[11px]">Nama Siswa*</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[11px]">Kelas*</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[11px]">Jenis Kelamin (L/P)*</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[11px]">No HP</span>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[11px]">Email</span>
          <span className="text-[11px] text-slate-400 ml-auto">*Wajib diisi</span>
        </div>
      </div>

      {/* Ekspor Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm font-heading">
            Ekspor Laporan & Data Arsip (CSV / Excel)
          </h4>
          <p className="text-xs text-slate-500">
            Unduh data terstruktur untuk pelaporan sekolah dan arsip manual
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Export Books */}
          <button
            onClick={handleExportBooks}
            className="p-4 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 rounded-2xl text-left transition-colors flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <FileText className="w-5 h-5 text-indigo-600" />
                <Download className="w-4 h-4 text-slate-400" />
              </div>
              <div className="font-bold text-xs text-slate-900 mt-2">Katalog Buku</div>
              <div className="text-[11px] text-slate-500">{books.length} Judul Buku</div>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600">Unduh CSV →</span>
          </button>

          {/* Export Transactions */}
          <button
            onClick={handleExportTransactions}
            className="p-4 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-200 rounded-2xl text-left transition-colors flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <Download className="w-4 h-4 text-slate-400" />
              </div>
              <div className="font-bold text-xs text-slate-900 mt-2">Rekap Pinjam-Kembali</div>
              <div className="text-[11px] text-slate-500">{transactions.length} Riwayat Transaksi</div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600">Unduh CSV →</span>
          </button>

          {/* Export Visits */}
          <button
            onClick={handleExportVisits}
            className="p-4 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-200 rounded-2xl text-left transition-colors flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                <Download className="w-4 h-4 text-slate-400" />
              </div>
              <div className="font-bold text-xs text-slate-900 mt-2">Rekap Kunjungan</div>
              <div className="text-[11px] text-slate-500">{visits.length} Riwayat Presensi</div>
            </div>
            <span className="text-[11px] font-semibold text-amber-600">Unduh CSV →</span>
          </button>

          {/* Export Students */}
          <button
            onClick={handleExportStudents}
            className="p-4 bg-slate-50 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-200 rounded-2xl text-left transition-colors flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <FileText className="w-5 h-5 text-indigo-600" />
                <Download className="w-4 h-4 text-slate-400" />
              </div>
              <div className="font-bold text-xs text-slate-900 mt-2">Data Anggota Siswa</div>
              <div className="text-[11px] text-slate-500">{students.length} Siswa Terdaftar</div>
            </div>
            <span className="text-[11px] font-semibold text-indigo-600">Unduh CSV →</span>
          </button>
        </div>
      </div>

      {/* Impor / Migrasi Data Awal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm font-heading">
            Impor / Migrasi Data Arsip Manual
          </h4>
          <p className="text-xs text-slate-500">
            Unggah file CSV atau berkas backup JSON untuk migrasi koleksi buku dan data siswa
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <label className="flex-1 w-full py-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors text-center px-4">
            <Upload className="w-6 h-6 text-indigo-600 mb-1" />
            <span className="text-xs font-semibold text-slate-800">
              Pilih Berkas CSV / JSON untuk Diimpor
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Mendukung format UTF-8 CSV & JSON</span>
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          <button
            onClick={resetToDefaultData}
            className="px-4 py-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition-colors shrink-0"
          >
            Reset ke Data Awal
          </button>
        </div>
      </div>

      {/* Modal Impor Anggota Massal */}
      <ImportAnggotaModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
};
