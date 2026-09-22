import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
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
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
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

  return (
    <div className="space-y-4">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1 rounded-2xl w-full sm:w-fit border border-slate-200 overflow-x-auto max-w-full scrollbar-none">
        <button
          onClick={() => setActiveTab('pinjam')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'pinjam'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>Peminjaman Baru</span>
        </button>

        <button
          onClick={() => setActiveTab('kembali')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'kembali'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Pengembalian</span>
        </button>

        <button
          onClick={() => setActiveTab('riwayat')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'riwayat'
              ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Riwayat ({transactions.length})</span>
        </button>
      </div>

      {/* TAB 1: PINJAM BUKU */}
      {activeTab === 'pinjam' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Form Side */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Proses Peminjaman Cepat
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Petugas: <strong>{currentUser?.adminData?.name || 'Admin'}</strong>
              </span>
            </div>

            <form onSubmit={handleProcessBorrow} className="space-y-4 text-xs">
              {/* Step 1: Scan Siswa */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Pindai Kartu Siswa (ID / NISN)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      placeholder="Pindai atau ketik ID/NISN siswa..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setScannerMode('student')}
                    className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-xl font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Pindai</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Scan Buku */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Pindai Barcode Buku
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={selectedBookBarcode}
                      onChange={(e) => setSelectedBookBarcode(e.target.value)}
                      placeholder="Pindai barcode pada buku..."
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setScannerMode('book')}
                    className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-xl font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Pindai</span>
                  </button>
                </div>
              </div>

              {/* Durasi & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Durasi / Waktu Pinjam</label>
                  <select
                    value={durationOption}
                    onChange={(e) => setDurationOption(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="3">3 Hari</option>
                    <option value="7">7 Hari (Standar)</option>
                    <option value="14">14 Hari</option>
                    <option value="30">30 Hari (Buku Paket Singkat)</option>
                    <option value="180">1 Semester (180 Hari - Buku Pelajaran)</option>
                    <option value="DITENTUKAN_NANTI">Ditentukan Nanti (Buku Pelajaran - TBD)</option>
                    <option value="KUSTOM">Kustom (Pilih Tanggal Pengembalian)</option>
                  </select>

                  {/* Contextual Helpers */}
                  {durationOption === '180' && (
                    <p className="text-[11px] text-indigo-600 font-medium mt-1">
                      Cocok untuk pinjaman Buku Pelajaran Pokok selama 1 Semester (180 Hari).
                    </p>
                  )}
                  {durationOption === 'DITENTUKAN_NANTI' && (
                    <p className="text-[11px] text-amber-700 font-medium mt-1">
                      Waktu & tanggal pengembalian akan ditentukan nanti di akhir semester.
                    </p>
                  )}
                  {durationOption === 'KUSTOM' && (
                    <div className="mt-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Pilih Tanggal Pengembalian:
                      </label>
                      <input
                        type="date"
                        value={customDueDate}
                        onChange={(e) => setCustomDueDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-600 text-xs font-semibold text-indigo-900"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    value={loanNotes}
                    onChange={(e) => setLoanNotes(e.target.value)}
                    placeholder="Opsional (mis: buku pelajaran semester 1)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!currentStudent || !currentBook || currentBook.availableCopies <= 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-600/20"
              >
                <Check className="w-4 h-4" />
                <span>Konfirmasi Peminjaman Buku</span>
              </button>
            </form>
          </div>

          {/* Real-time Verification Preview Side */}
          <div className="lg:col-span-5 space-y-4">
            {/* Student Preview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Verifikasi Buku
              </div>
              {currentBook ? (
                <div className="flex items-center gap-3">
                  <img
                    src={currentBook.coverUrl}
                    alt=""
                    className="w-12 h-16 object-cover rounded-xl border border-slate-200"
                  />
                  <div className="min-w-0 space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                      {currentBook.title}
                    </h4>
                    <div className="text-slate-500 text-xs">
                      {currentBook.author} • {currentBook.category}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          currentBook.availableCopies > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        Tersedia: {currentBook.availableCopies} dari {currentBook.totalCopies}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Belum ada buku terpilih
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PENGEMBALIAN BUKU */}
      {activeTab === 'kembali' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              Pengembalian Buku Cepat
            </h3>
            <span className="text-[11px] text-slate-500">
              Penerima: <strong>{currentUser?.adminData?.name || 'Admin'}</strong>
            </span>
          </div>

          <form onSubmit={handleProcessReturn} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Pindai Barcode Buku atau No. Transaksi
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={returnBarcode}
                    onChange={(e) => setReturnBarcode(e.target.value)}
                    placeholder="Pindai barcode buku yang dikembalikan..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setScannerMode('return')}
                  className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Pindai</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan Pengembalian (Kondisi Buku)
              </label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Contoh: Kondisi buku utuh & bersih"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={!returnBarcode.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-600/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Proses Pengembalian Buku</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3 / RIWAYAT TRANSAKSI TABEL */}
      {(activeTab === 'riwayat' || activeTab === 'pinjam' || activeTab === 'kembali') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header & Filters */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari transaksi, buku, siswa, atau admin..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="Semua">Semua Status</option>
                <option value="Dipinjam">Dipinjam</option>
                <option value="Terlambat">Terlambat</option>
                <option value="Kembali">Kembali</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="py-3 px-4">No. Transaksi & Buku</th>
                  <th className="py-3 px-4">Peminjam</th>
                  <th className="py-3 px-4">Tgl Pinjam / Tempo</th>
                  <th className="py-3 px-4">Petugas Pinjam</th>
                  <th className="py-3 px-4">Petugas Terima</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data transaksi ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 line-clamp-1">{trx.bookTitle}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {trx.id} • Barcode: {trx.bookBarcode}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{trx.studentName}</div>
                        <div className="text-[10px] text-slate-500">
                          {trx.studentClass} • {trx.studentNisn}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div>Pinjam: {trx.borrowDate}</div>
                        <div
                          className={`text-[11px] font-semibold ${
                            trx.status === 'Terlambat'
                              ? 'text-rose-600 font-bold'
                              : 'text-slate-500'
                          }`}
                        >
                          Tempo:{' '}
                          {trx.dueDate === 'Ditentukan Nanti' ? (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[10px]">
                              Ditentukan Nanti
                            </span>
                          ) : (
                            trx.dueDate
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-medium text-slate-800">{trx.borrowAdminName}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {trx.returnAdminName ? (
                          <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {trx.returnAdminName}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-md border ${
                            trx.status === 'Kembali'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : trx.status === 'Terlambat'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}
                        >
                          {trx.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {trx.status !== 'Kembali' ? (
                          <button
                            onClick={() => handleDirectReturn(trx.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors"
                          >
                            Kembalikan
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Selesai</span>
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
