import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { BookCover } from '../common/BookCover';
import {
  ScanLine,
  CheckCircle2,
  Calendar,
  Clock,
  Search,
  User,
  BookOpen,
  ArrowRight,
  RotateCcw,
  Check,
  Filter,
  AlertCircle,
  Sparkles,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PinjamKembali: React.FC = () => {
  const {
    students,
    books,
    transactions,
    borrowBook,
    returnBook,
    currentUser,
    showToast,
  } = useLibrary();

  // Active Tab: 'pinjam' | 'kembali' | 'riwayat'
  const [activeTab, setActiveTab] = useState<'pinjam' | 'kembali' | 'riwayat'>('pinjam');

  // Scanner Modals
  const [scannerMode, setScannerMode] = useState<'student' | 'book' | 'return' | null>(null);

  // Borrow Flow State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBookBarcode, setSelectedBookBarcode] = useState('');
  const [durationOption, setDurationOption] = useState<string>('7');
  const [customDueDate, setCustomDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [loanNotes, setLoanNotes] = useState('');

  // Return Flow State
  const [returnBarcode, setReturnBarcode] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  // Transaction Search & Filter
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Dipinjam' | 'Kembali' | 'Terlambat'>('Semua');

  // Matched objects for preview
  const currentStudent = students.find(
    (s) =>
      s.id.toLowerCase() === selectedStudentId.trim().toLowerCase() ||
      s.nisn === selectedStudentId.trim()
  );

  const currentBook = books.find(
    (b) =>
      b.id.toLowerCase() === selectedBookBarcode.trim().toLowerCase() ||
      b.barcode === selectedBookBarcode.trim()
  );

  // Handle Borrow Submission
  const handleProcessBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedBookBarcode) {
      showToast('error', 'Data Belum Lengkap', 'Pindai kartu siswa dan barcode buku');
      return;
    }

    let effectiveDue: number | string = 7;
    if (durationOption === 'DITENTUKAN_NANTI') {
      effectiveDue = 'Ditentukan Nanti';
    } else if (durationOption === 'KUSTOM') {
      effectiveDue = customDueDate || 'Ditentukan Nanti';
    } else {
      effectiveDue = Number(durationOption) || 7;
    }

    const res = borrowBook(selectedStudentId, selectedBookBarcode, effectiveDue, loanNotes);
    if (res.success) {
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 }, ticks: 80 });
      setSelectedStudentId('');
      setSelectedBookBarcode('');
      setLoanNotes('');
    }
  };

  // Handle Return Submission
  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnBarcode) {
      showToast('error', 'Masukkan Barcode', 'Pindai barcode buku yang dikembalikan');
      return;
    }

    const res = returnBook(returnBarcode, returnNotes);
    if (res.success) {
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 }, ticks: 80 });
      setReturnBarcode('');
      setReturnNotes('');
    }
  };

  // Direct return from table
  const handleDirectReturn = (trxId: string) => {
    returnBook(trxId);
  };

  // Filtered Transactions
  const filteredTransactions = transactions.filter((t) => {
    const q = searchFilter.toLowerCase().trim();
    const matchQ =
      !q ||
      t.bookTitle.toLowerCase().includes(q) ||
      t.studentName.toLowerCase().includes(q) ||
      t.studentNisn.includes(q) ||
      t.bookBarcode.includes(q) ||
      t.borrowAdminName.toLowerCase().includes(q) ||
      (t.returnAdminName && t.returnAdminName.toLowerCase().includes(q));

    const matchStatus =
      statusFilter === 'Semua' ||
      (statusFilter === 'Dipinjam' && t.status === 'Dipinjam') ||
      (statusFilter === 'Kembali' && t.status === 'Kembali') ||
      (statusFilter === 'Terlambat' && t.status === 'Terlambat');

    return matchQ && matchStatus;
  });

  // Export Transactions to CSV Spreadsheet
  const handleExportTrxCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('error', 'Kosong', 'Tidak ada data transaksi untuk diekspor');
      return;
    }
    const headers = [
      'No',
      'ID Transaksi',
      'Judul Buku',
      'Barcode Buku',
      'Peminjam',
      'NISN Peminjam',
      'Kelas',
      'Tanggal Pinjam',
      'Jatuh Tempo',
      'Tanggal Kembali',
      'Petugas Pinjam',
      'Petugas Terima',
      'Status',
    ];
    const rows = filteredTransactions.map((trx, i) => [
      i + 1,
      `"${trx.id}"`,
      `"${(trx.bookTitle || '').replace(/"/g, '""')}"`,
      `"${trx.bookBarcode || ''}"`,
      `"${(trx.studentName || '').replace(/"/g, '""')}"`,
      `"${trx.studentNisn || ''}"`,
      `"${trx.studentClass || ''}"`,
      `"${trx.borrowDate || ''}"`,
      `"${trx.dueDate || ''}"`,
      `"${trx.returnDate || ''}"`,
      `"${(trx.borrowAdminName || '').replace(/"/g, '""')}"`,
      `"${(trx.returnAdminName || '').replace(/"/g, '""')}"`,
      `"${trx.status || ''}"`,
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sirkulasi_transaksi_smpn1_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Berhasil', 'Data transaksi sirkulasi berhasil diekspor ke CSV');
  };

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 bg-[#F5F7FA] p-1 rounded-xl w-full sm:w-fit border border-[#E2E8F0] overflow-x-auto max-w-full scrollbar-none">
        <button
          onClick={() => setActiveTab('pinjam')}
          className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98] select-none ${
            activeTab === 'pinjam'
              ? 'bg-[#1E3A5F] text-white shadow-xs font-bold'
              : 'text-[#1A1A2E] hover:bg-white hover:text-[#1E3A5F]'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Peminjaman Baru</span>
        </button>

        <button
          onClick={() => setActiveTab('kembali')}
          className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98] select-none ${
            activeTab === 'kembali'
              ? 'bg-[#F5A623] text-[#1A1A2E] shadow-xs font-bold'
              : 'text-[#1A1A2E] hover:bg-white hover:text-[#1E3A5F]'
          }`}
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          <span>Pengembalian</span>
        </button>

        <button
          onClick={() => setActiveTab('riwayat')}
          className={`min-h-[44px] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.98] select-none ${
            activeTab === 'riwayat'
              ? 'bg-white text-[#1E3A5F] shadow-xs border border-[#E2E8F0] font-bold'
              : 'text-[#1A1A2E] hover:bg-white hover:text-[#1E3A5F]'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Riwayat ({transactions.length})</span>
        </button>
      </div>

      {/* TAB 1: PINJAM BUKU */}
      {activeTab === 'pinjam' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Form Side */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="text-sm font-bold text-[#1A1A2E] font-heading">
                Proses Peminjaman Cepat
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Petugas: <strong className="text-[#1A1A2E]">{currentUser?.adminData?.name || 'Admin'}</strong>
              </span>
            </div>

            <form onSubmit={handleProcessBorrow} className="space-y-4 text-xs">
              {/* Step 1: Scan Siswa */}
              <div>
                <label className="block font-semibold text-[#1A1A2E] mb-1">
                  1. Pindai Kartu Siswa (ID / NISN)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      placeholder="cth: 0098765431"
                      className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-[#1A1A2E]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setScannerMode('student')}
                    className="min-h-[44px] px-4 py-2 bg-[#F5F7FA] hover:bg-[#E2E8F0] active:bg-slate-300 text-[#1E3A5F] border border-[#E2E8F0] rounded-xl font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Pindai</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Scan Buku */}
              <div>
                <label className="block font-semibold text-[#1A1A2E] mb-1">
                  2. Pindai Barcode Buku
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={selectedBookBarcode}
                      onChange={(e) => setSelectedBookBarcode(e.target.value)}
                      placeholder="cth: 978-602-03-8591-4"
                      className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-[#1A1A2E]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setScannerMode('book')}
                    className="min-h-[44px] px-4 py-2 bg-[#F5F7FA] hover:bg-[#E2E8F0] active:bg-slate-300 text-[#1E3A5F] border border-[#E2E8F0] rounded-xl font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Pindai</span>
                  </button>
                </div>
              </div>

              {/* Durasi & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A1A2E] mb-1">Durasi / Waktu Pinjam</label>
                  <select
                    value={durationOption}
                    onChange={(e) => setDurationOption(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] font-medium text-[#1A1A2E]"
                  >
                    <option value="3">3 Hari</option>
                    <option value="7">7 Hari (Standar)</option>
                    <option value="14">14 Hari</option>
                    <option value="30">30 Hari (Buku Paket Singkat)</option>
                    <option value="180">1 Semester (180 Hari - Buku Pelajaran)</option>
                    <option value="DITENTUKAN_NANTI">Ditentukan Nanti (Buku Pelajaran - TBD)</option>
                    <option value="KUSTOM">Kustom (Pilih Tanggal Pengembalian)</option>
                  </select>

                  {durationOption === 'KUSTOM' && (
                    <div className="mt-2">
                      <input
                        type="date"
                        value={customDueDate}
                        onChange={(e) => setCustomDueDate(e.target.value)}
                        className="w-full min-h-[44px] px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-xs font-semibold text-[#1A1A2E]"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-[#1A1A2E] mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    value={loanNotes}
                    onChange={(e) => setLoanNotes(e.target.value)}
                    placeholder="cth: buku pelajaran semester 1"
                    className="w-full min-h-[44px] px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-[#1A1A2E]"
                  />
                </div>
              </div>

              {/* Submit Button (btn-primary: Gold/Amber #F5A623) */}
              <button
                type="submit"
                disabled={!currentStudent || !currentBook || currentBook.availableCopies <= 0}
                className="w-full min-h-[44px] py-3 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] disabled:bg-[#E2E8F0] disabled:text-slate-400 disabled:cursor-not-allowed text-[#1A1A2E] text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer select-none"
              >
                <Check className="w-4 h-4" />
                <span>Konfirmasi Peminjaman Buku</span>
              </button>
            </form>
          </div>

          {/* Real-time Verification Preview Side */}
          <div className="lg:col-span-5 space-y-4">
            {/* Student Preview Card */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Verifikasi Siswa
              </div>
              {currentStudent ? (
                <div className="flex items-center gap-3">
                  <img
                    src={currentStudent.photoUrl}
                    alt=""
                    className="w-12 h-14 object-cover rounded-xl border border-slate-200"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {currentStudent.name}
                    </h4>
                    <div className="text-slate-500 text-xs mt-0.5">
                      Kelas <strong className="text-slate-700">{currentStudent.classGrade}</strong> • NISN {currentStudent.nisn}
                    </div>
                    <div className="text-[11px] text-indigo-600 font-medium mt-1">
                      Pinjaman Aktif: {currentStudent.activeLoanCount} buku
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Belum ada siswa terpilih
                </div>
              )}
            </div>

            {/* Book Preview Card */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Verifikasi Buku
              </div>
              {currentBook ? (
                <div className="flex items-center gap-3">
                  <BookCover
                    coverUrl={currentBook.coverUrl}
                    title={currentBook.title}
                    className="w-12 h-16 rounded-xl border border-[#E2E8F0] shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <h4 className="font-bold text-[#1A1A2E] text-sm line-clamp-1">
                      {currentBook.title}
                    </h4>
                    <div className="text-slate-500 text-xs">
                      {currentBook.author} • {currentBook.category}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          currentBook.availableCopies > 0
                            ? 'bg-emerald-50 text-[#10B981]'
                            : 'bg-rose-50 text-[#EF4444]'
                        }`}
                      >
                        Tersedia: {currentBook.availableCopies} dari {currentBook.totalCopies}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 bg-[#F5F7FA] rounded-xl border border-dashed border-[#E2E8F0]">
                  Belum ada buku terpilih
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENGEMBALIAN BUKU */}
      {activeTab === 'kembali' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <h3 className="text-sm font-bold text-[#1A1A2E] font-heading">
              Pengembalian Buku Cepat
            </h3>
            <span className="text-xs text-slate-500">
              Penerima: <strong className="text-[#1A1A2E]">{currentUser?.adminData?.name || 'Admin'}</strong>
            </span>
          </div>

          <form onSubmit={handleProcessReturn} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#1A1A2E] mb-1">
                Pindai Barcode Buku atau No. Transaksi
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={returnBarcode}
                    onChange={(e) => setReturnBarcode(e.target.value)}
                    placeholder="cth: 978-602-03-8591-4"
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-[#1A1A2E]"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setScannerMode('return')}
                  className="min-h-[44px] px-4 py-2 bg-[#F5F7FA] hover:bg-[#E2E8F0] active:bg-slate-300 text-[#1E3A5F] border border-[#E2E8F0] rounded-xl font-bold flex items-center gap-2 shrink-0 transition-all cursor-pointer"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Pindai</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#1A1A2E] mb-1">
                Catatan Pengembalian
              </label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="cth: Kondisi buku utuh & bersih"
                className="w-full min-h-[44px] px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-[#1A1A2E]"
              />
            </div>

            <button
              type="submit"
              disabled={!returnBarcode.trim()}
              className="w-full min-h-[44px] py-3 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] disabled:bg-[#E2E8F0] disabled:text-slate-400 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer select-none"
            >
              <RotateCcw className="w-4 h-4 text-[#F5A623]" />
              <span>Proses Pengembalian Buku</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3 / RIWAYAT TRANSAKSI TABEL SPREADSHEET */}
      {(activeTab === 'riwayat' || activeTab === 'pinjam' || activeTab === 'kembali') && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {/* Header & Excel Toolbar */}
          <div className="p-3 bg-[#F5F7FA] border-b border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#1E3A5F]" />
              <h4 className="text-xs font-bold text-[#1A1A2E] font-heading">Sel Spreadsheet Transaksi Sirkulasi</h4>
              <span className="text-[10px] bg-white text-[#1E3A5F] font-bold px-2 py-0.5 rounded border border-[#E2E8F0]">
                {filteredTransactions.length} Transaksi
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-44 sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="cth: Laskar Pelangi / Fadhil"
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#1A1A2E] focus:outline-none"
              >
                <option value="Semua">Semua Status</option>
                <option value="Dipinjam">Dipinjam</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Kembali">Kembali</option>
              </select>

              <button
                type="button"
                onClick={handleExportTrxCSV}
                className="min-h-[36px] px-3 py-1.5 bg-[#1E3A5F] hover:bg-[#162C47] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                title="Ekspor CSV"
              >
                <Download className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-slate-200/90 text-slate-700 text-[11px] font-mono border-b border-slate-300">
                  <th className="w-10 p-1.5 text-center border-r border-slate-300 bg-slate-300/60 font-bold">#</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[180px]">A: Judul & Barcode Buku</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[150px]">B: Peminjam (Siswa)</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[130px]">C: Pinjam / Tempo</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[120px]">D: Petugas Pinjam</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[120px]">E: Petugas Terima</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 text-center min-w-[90px]">F: Status</th>
                  <th className="p-1.5 text-center min-w-[100px]">G: Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock className="w-8 h-8 text-slate-300" />
                        <p className="text-xs text-slate-500 font-medium">Belum ada transaksi sirkulasi.</p>
                        <button
                          type="button"
                          onClick={() => setActiveTab('pinjam')}
                          className="min-h-[44px] px-4 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs select-none"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Peminjaman Baru</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((trx, index) => (
                    <tr key={trx.id} className="hover:bg-[#F5F7FA] transition-colors">
                      {/* Row Num */}
                      <td className="p-1.5 text-center font-mono text-[11px] font-bold bg-[#F5F7FA] text-slate-500 border-r border-[#E2E8F0] select-none">
                        {index + 1}
                      </td>

                      {/* Buku */}
                      <td className="p-2 border-r border-[#E2E8F0]">
                        <div className="font-bold text-[#1A1A2E] line-clamp-1">{trx.bookTitle}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ID: {trx.id} • BC: {trx.bookBarcode}
                        </div>
                      </td>

                      {/* Peminjam */}
                      <td className="p-2 border-r border-[#E2E8F0]">
                        <div className="font-bold text-[#1A1A2E]">{trx.studentName}</div>
                        <div className="text-[10px] text-[#1E3A5F] font-semibold">
                          {trx.studentClass} • NISN: {trx.studentNisn}
                        </div>
                      </td>

                      {/* Tanggal */}
                      <td className="p-2 border-r border-[#E2E8F0] font-mono text-[11px] text-slate-600">
                        <div>Pinjam: {trx.borrowDate}</div>
                        <div
                          className={`text-[10px] font-bold ${
                            trx.status === 'Terlambat'
                              ? 'text-[#EF4444]'
                              : 'text-slate-500'
                          }`}
                        >
                          Tempo:{' '}
                          {trx.dueDate === 'Ditentukan Nanti' ? (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px]">
                              TBD
                            </span>
                          ) : (
                            trx.dueDate
                          )}
                        </div>
                      </td>

                      {/* Admin Pinjam */}
                      <td className="p-2 border-r border-[#E2E8F0] text-slate-700">
                        <span className="font-semibold text-[#1A1A2E]">{trx.borrowAdminName}</span>
                      </td>

                      {/* Admin Terima */}
                      <td className="p-2 border-r border-[#E2E8F0] text-slate-700">
                        {trx.returnAdminName ? (
                          <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                            {trx.returnAdminName}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-1.5 border-r border-[#E2E8F0] text-center">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                            trx.status === 'Kembali'
                              ? 'bg-emerald-50 text-[#10B981] border-emerald-200'
                              : trx.status === 'Terlambat'
                              ? 'bg-rose-50 text-[#EF4444] border-rose-200'
                              : 'bg-blue-50 text-[#1E3A5F] border-blue-200'
                          }`}
                        >
                          {trx.status}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="p-1.5 text-center">
                        {trx.status !== 'Kembali' ? (
                          <button
                            type="button"
                            onClick={() => handleDirectReturn(trx.id)}
                            className="min-h-[36px] px-3 py-1 bg-[#1E3A5F] hover:bg-[#162C47] text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-2xs active:scale-95"
                          >
                            Kembalikan
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={scannerMode !== null}
        onClose={() => setScannerMode(null)}
        title={
          scannerMode === 'student'
            ? 'Pindai Kartu'
            : scannerMode === 'book'
            ? 'Pindai Barcode Buku'
            : 'Pindai Barcode Pengembalian'
        }
        placeholder={
          scannerMode === 'student'
            ? 'Masukkan ID Kartu / NISN Siswa...'
            : 'Masukkan Barcode Buku...'
        }
        onScanSuccess={(code) => {
          const clean = code.trim();
          if (scannerMode === 'student') {
            const st = students.find(
              (s) => s.id.toLowerCase() === clean.toLowerCase() || s.nisn === clean
            );
            if (st) {
              setSelectedStudentId(st.id);
              showToast('info', 'Siswa Terpilih', `${st.name} (${st.classGrade})`);
              return { success: true };
            } else {
              return { success: false, message: `Siswa "${clean}" tidak ditemukan` };
            }
          } else if (scannerMode === 'book') {
            const bk = books.find(
              (b) => b.barcode.toLowerCase() === clean.toLowerCase() || b.id.toLowerCase() === clean.toLowerCase()
            );
            if (bk) {
              setSelectedBookBarcode(bk.barcode);
              showToast('info', 'Buku Terpilih', bk.title);
              return { success: true };
            } else {
              return { success: false, message: `Buku dengan barcode "${clean}" tidak ditemukan` };
            }
          } else if (scannerMode === 'return') {
            setReturnBarcode(clean);
            const res = returnBook(clean);
            if (res.success) {
              return { success: true };
            } else {
              return { success: false, message: res.message || 'Buku tidak dalam status dipinjam' };
            }
          }
          return { success: true };
        }}
      />
    </div>
  );
};
