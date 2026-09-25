import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BarcodeDisplay } from '../common/BarcodeDisplay';
import { BookCover } from '../common/BookCover';
import { FormulirPendataanSiswa } from './FormulirPendataanSiswa';
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  IdCard,
  History,
  Sparkles,
  Search,
  User,
  Shield,
  Download,
  Award,
  ArrowRight,
  LogOut,
  UserCheck,
  MapPin,
} from 'lucide-react';
import { motion } from 'motion/react';

export const PortalSiswa: React.FC = () => {
  const { currentUser, loginSiswa, logout, transactions, books, visits, students, logoUrl } = useLibrary();

  // Login form state
  const [cardId, setCardId] = useState('');
  const [nisnPass, setNisnPass] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [showFormulirModal, setShowFormulirModal] = useState(false);

  const student = currentUser?.role === 'siswa' ? currentUser.studentData : null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!cardId.trim() || !nisnPass.trim()) {
      setErrorMessage('Lengkapi ID Kartu & NISN');
      return;
    }
    const res = loginSiswa(cardId, nisnPass);
    if (!res.success) {
      setErrorMessage(res.error || 'Login gagal');
    }
  };

  const fillQuickDemo = (sampleId: string, sampleNisn: string) => {
    setCardId(sampleId);
    setNisnPass(sampleNisn);
  };

  // If not logged in as student, show login screen
  if (!student) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-[#E2E8F0] shadow-xl max-w-md w-full p-6 sm:p-8"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#F5F7FA] text-[#1E3A5F] rounded-xl flex items-center justify-center mx-auto mb-3 border border-[#E2E8F0] shadow-xs">
              <IdCard className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#1A1A2E] font-heading">Portal Siswa</h2>
            <p className="text-xs text-slate-500 mt-1">Perpustakaan Bunga Tanjung — SMPN 1 Bengkalis</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">
                ID Kartu Perpustakaan / NISN
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  placeholder="cth: BT-SMP1-2024-001"
                  className="w-full min-h-[44px] pl-9 pr-3 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1E3A5F] focus:bg-white text-[#1A1A2E]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">
                Password (NISN)
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={nisnPass}
                  onChange={(e) => setNisnPass(e.target.value)}
                  placeholder="cth: 0098765431"
                  className="w-full min-h-[44px] pl-9 pr-3 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#1E3A5F] focus:bg-white text-[#1A1A2E]"
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[44px] py-2.5 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] disabled:bg-[#E2E8F0] disabled:text-slate-400 text-[#1A1A2E] text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <span>Masuk Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0]">
            <p className="text-[11px] font-semibold text-slate-400 mb-2">Akun Contoh Siswa:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('BT-SMP1-2024-001', '0098765431')}
                className="p-2.5 min-h-[44px] text-left bg-[#F5F7FA] hover:bg-white hover:border-[#1E3A5F] border border-[#E2E8F0] rounded-xl transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-[#1A1A2E]">Ahmad Fadhil</div>
                <div className="text-[10px] text-slate-500">Kelas VIII-A (1 Buku)</div>
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('BT-SMP1-2024-004', '0098765434')}
                className="p-2.5 min-h-[44px] text-left bg-[#F5F7FA] hover:bg-white hover:border-[#1E3A5F] border border-[#E2E8F0] rounded-xl transition-all cursor-pointer"
              >
                <div className="text-xs font-semibold text-[#1A1A2E]">Zahra Putri</div>
                <div className="text-[10px] text-slate-500">Kelas IX-C (2 Buku)</div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Filter student transactions
  const studentTransactions = transactions.filter((t) => t.studentId === student.id);
  const activeLoans = studentTransactions.filter((t) => t.status !== 'Kembali');
  const pastLoans = studentTransactions.filter((t) => t.status === 'Kembali');

  // Student visit rank
  const sortedStudents = [...students].sort((a, b) => b.visitCount - a.visitCount);
  const studentRank = sortedStudents.findIndex((s) => s.id === student.id) + 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Student Profile Card Banner */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={student.photoUrl}
              alt={student.name}
              className="w-16 h-16 rounded-xl object-cover border-2 border-[#E2E8F0] shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#1A1A2E] font-heading">
                  {student.name}
                </h1>
                <span className="px-2.5 py-0.5 bg-[#F5F7FA] text-[#1E3A5F] text-xs font-bold rounded-lg border border-[#E2E8F0]">
                  {student.classGrade}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span>ID: <strong className="text-[#1A1A2E]">{student.id}</strong></span>
                <span>•</span>
                <span>NISN: <strong className="text-[#1A1A2E]">{student.nisn}</strong></span>
              </div>
            </div>
          </div>

          {/* Action buttons & Stats Pill */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-[#F5F7FA] px-3 py-2 min-h-[44px] rounded-xl border border-[#E2E8F0]">
              <Award className="w-4 h-4 text-[#F5A623] shrink-0" />
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-medium">Peringkat</div>
                <div className="text-xs font-bold text-[#1A1A2E]">#{studentRank} ({student.visitCount}x)</div>
              </div>
            </div>

            <button
              onClick={() => setShowFormulirModal(true)}
              className="px-3.5 py-2 min-h-[44px] bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Lengkapi data Tempat Tanggal Lahir dan Pasfoto 3x4"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Data Kartu 3x4</span>
            </button>

            <button
              onClick={() => setShowCardModal(true)}
              className="px-4 py-2 min-h-[44px] bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <IdCard className="w-4 h-4" />
              <span>Kartu Anggota</span>
            </button>

            <button
              onClick={logout}
              className="px-3 py-2 min-h-[44px] bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Keluar dari Portal Siswa"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Warning banner if student has not completed TTL / Pasfoto 3x4 */}
        {(!student.pob || !student.dob || !student.cardDataCompleted) && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <strong>Data Kartu Pustaka Belum Lengkap!</strong> Sediakan Tempat/Tanggal Lahir dan Pasfoto 3x4 formal seragam sekolah.
              </div>
            </div>
            <button
              onClick={() => setShowFormulirModal(true)}
              className="px-3.5 py-2 min-h-[44px] bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] font-bold rounded-xl text-xs shrink-0 cursor-pointer transition-all"
            >
              Lengkapi Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Active Borrowed Books Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1E3A5F]" />
            <h2 className="text-base font-bold text-[#1A1A2E] font-heading">Buku Sedang Dipinjam</h2>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#F5F7FA] text-[#1E3A5F] border border-[#E2E8F0]">
              {activeLoans.length}
            </span>
          </div>
        </div>

        {activeLoans.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#10B981] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#1A1A2E]">Tidak ada pinjaman buku aktif</p>
            <p className="text-xs text-slate-400 mt-0.5">Kunjungi perpustakaan untuk meminjam koleksi buku.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLoans.map((loan) => {
              const dueDate = new Date(loan.dueDate);
              const today = new Date();
              const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
              const isOverdue = diffDays < 0;

              return (
                <div
                  key={loan.id}
                  className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 flex gap-4 items-start"
                >
                  <BookCover
                    coverUrl={loan.bookCoverUrl}
                    title={loan.bookTitle}
                    className="w-16 h-22 rounded-xl border border-[#E2E8F0] shrink-0 shadow-xs"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h3 className="font-bold text-sm text-[#1A1A2E] leading-snug line-clamp-2">
                        {loan.bookTitle}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Barcode: {loan.bookBarcode}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="flex items-center gap-1 text-slate-600 bg-[#F5F7FA] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pinjam: {loan.borrowDate}</span>
                      </div>
                      <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold ${
                          isOverdue
                            ? 'bg-rose-50 border-rose-200 text-rose-700'
                            : diffDays <= 2
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {isOverdue
                            ? `Terlambat ${Math.abs(diffDays)} Hari`
                            : `Tempo: ${loan.dueDate} (${diffDays} hari)`}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      Petugas: <span className="text-[#1A1A2E] font-medium">{loan.borrowAdminName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Loan History Table */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#1E3A5F]" />
            <h3 className="text-sm font-bold text-[#1A1A2E] font-heading">Riwayat Peminjaman & Pengembalian</h3>
          </div>
          <span className="text-xs text-slate-400">{pastLoans.length} Transaksi Selesai</span>
        </div>

        {pastLoans.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Belum ada riwayat buku yang dikembalikan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-slate-500 font-semibold">
                  <th className="py-3 px-4">Judul Buku</th>
                  <th className="py-3 px-4">Tgl Pinjam</th>
                  <th className="py-3 px-4">Tgl Kembali</th>
                  <th className="py-3 px-4">Petugas Pinjam</th>
                  <th className="py-3 px-4">Petugas Terima</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {pastLoans.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F5F7FA]/70">
                    <td className="py-3 px-4 font-semibold text-[#1A1A2E]">
                      <div>{item.bookTitle}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{item.bookBarcode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.borrowDate}</td>
                    <td className="py-3 px-4 text-slate-600">{item.returnDate || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{item.borrowAdminName}</td>
                    <td className="py-3 px-4 text-slate-600">{item.returnAdminName || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-md border border-emerald-200">
                        Kembali
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Digital Member Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-md w-full overflow-hidden p-6 space-y-5">
            {/* Card Preview Container */}
            <div className="bg-[#1E3A5F] rounded-xl p-5 text-white shadow-xl relative overflow-hidden border border-[#142842]">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      className="w-8 h-8 rounded-lg object-contain bg-white/90 p-0.5 border border-white/20 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-xs shrink-0">
                      <BookOpen className="w-4 h-4 text-[#F5A623]" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold tracking-tight">SMP NEGERI 1 BENGKALIS</div>
                    <div className="text-[9px] text-blue-200 uppercase tracking-wider">Perpustakaan Bunga Tanjung</div>
                  </div>
                </div>
                <div className="px-2 py-0.5 bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/30 rounded text-[9px] font-bold">
                  ANGGOTA
                </div>
              </div>

              {/* Student Details */}
              <div className="flex gap-3.5 items-center">
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="w-16 h-20 object-cover rounded-xl border-2 border-white/30 shrink-0 bg-slate-800"
                />
                <div className="space-y-1 min-w-0">
                  <div className="text-sm font-bold truncate">{student.name}</div>
                  <div className="text-[11px] text-blue-200">Kelas: <span className="font-semibold text-white">{student.classGrade}</span></div>
                  <div className="text-[11px] text-blue-200">NISN: <span className="font-semibold text-white font-mono">{student.nisn}</span></div>
                  <div className="text-[10px] text-blue-300 font-mono">{student.id}</div>
                </div>
              </div>

              {/* Barcode section on card */}
              <div className="mt-4 pt-3 border-t border-white/15 bg-white rounded-xl p-2 flex flex-col items-center justify-center">
                <BarcodeDisplay value={student.id} height={32} width={1.4} />
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 min-h-[44px] py-2.5 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Cetak / Simpan Kartu</span>
              </button>
              <button
                onClick={() => setShowCardModal(false)}
                className="min-h-[44px] px-4 py-2.5 bg-[#F5F7FA] hover:bg-[#E2E8F0] active:bg-slate-200 text-[#1A1A2E] rounded-xl text-xs font-semibold transition-all cursor-pointer border border-[#E2E8F0]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulir Pendataan Pasfoto 3x4 Modal */}
      {showFormulirModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="my-auto w-full max-w-2xl">
            <FormulirPendataanSiswa
              initialNisn={student.nisn}
              onClose={() => setShowFormulirModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
