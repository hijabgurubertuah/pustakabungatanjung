import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import {
  ScanLine,
  CalendarCheck,
  Search,
  Award,
  Sparkles,
  Check,
  UserCheck,
  Clock,
  Filter,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PendataanPengunjung: React.FC = () => {
  const { students, visits, recordVisit, showToast } = useLibrary();

  const [inputCode, setInputCode] = useState('');
  const [purpose, setPurpose] = useState('Membaca & Meminjam');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentCheckedStudent, setRecentCheckedStudent] = useState<any>(null);

  const handleScanOrSubmit = (codeToUse?: string) => {
    const code = (codeToUse || inputCode).trim();
    if (!code) {
      showToast('error', 'Masukkan ID', 'Pindai barcode kartu siswa');
      return { success: false, message: 'ID atau barcode kosong' };
    }

    const res = recordVisit(code, purpose);
    if (res.success && res.student) {
      setRecentCheckedStudent(res.student);
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
      setInputCode('');
      return { success: true };
    }
    return { success: false, message: res.message || 'Siswa tidak terdaftar' };
  };

  // Filtered Visits
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredVisits = visits.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      v.studentName.toLowerCase().includes(q) ||
      v.studentClass.toLowerCase().includes(q) ||
      v.studentNisn.includes(q) ||
      v.studentId.toLowerCase().includes(q)
    );
  });

  // Leaderboard students
  const leaderboard = [...students].sort((a, b) => b.visitCount - a.visitCount);

  // Export Visits to CSV Spreadsheet
  const handleExportVisitsCSV = () => {
    if (filteredVisits.length === 0) {
      showToast('error', 'Kosong', 'Tidak ada data kunjungan untuk diekspor');
      return;
    }
    const headers = ['No', 'ID Siswa', 'NISN', 'Nama Siswa', 'Kelas', 'Tanggal', 'Waktu', 'Keperluan'];
    const rows = filteredVisits.map((v, i) => {
      const time = new Date(v.timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return [
        i + 1,
        `"${v.studentId || ''}"`,
        `"${v.studentNisn || ''}"`,
        `"${(v.studentName || '').replace(/"/g, '""')}"`,
        `"${v.studentClass || ''}"`,
        `"${v.dateStr || ''}"`,
        `"${time}"`,
        `"${(v.purpose || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap_kunjungan_perpustakaan_${todayStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Berhasil', 'Data riwayat kunjungan berhasil diekspor ke CSV');
  };

  return (
    <div className="space-y-5">
      {/* Fast Scan Check-in Station Box */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-400/30">
                <UserCheck className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold font-heading">
                Gerbang Masuk Presensi Kunjungan
              </h3>
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              Pindai kartu siswa untuk pencatatan otomatis & akumulasi poin keaktifan
            </p>
          </div>

          {/* Today Counter Pill */}
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 text-center">
            <div className="text-xs text-indigo-200">Kunjungan Hari Ini</div>
            <div className="text-xl font-black text-emerald-300 font-heading">
              {visits.filter((v) => v.dateStr === todayStr).length} Siswa
            </div>
          </div>
        </div>

        {/* Input & Camera Trigger */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6 relative">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScanOrSubmit()}
              placeholder="Pindai barcode kartu / ketik ID atau NISN..."
              className="w-full px-4 py-3 bg-white text-slate-900 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-xs"
              autoFocus
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-3 bg-indigo-950/80 border border-indigo-700/60 text-indigo-100 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="Membaca & Meminjam">Membaca & Meminjam</option>
              <option value="Mengerjakan Tugas">Mengerjakan Tugas</option>
              <option value="Akses Komputer">Akses Komputer</option>
              <option value="Diskusi Kelompok">Diskusi Kelompok</option>
            </select>
          </div>

          <div className="md:col-span-3 flex gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 py-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ScanLine className="w-4 h-4 text-emerald-300" />
              <span>Pindai</span>
            </button>
            <button
              onClick={() => handleScanOrSubmit()}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center transition-colors shadow-md shadow-emerald-500/30"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recent checked feedback */}
        {recentCheckedStudent && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
            <img
              src={recentCheckedStudent.photoUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-cover border border-emerald-300"
            />
            <div className="text-xs">
              <div className="font-bold text-white">
                Selamat Datang, {recentCheckedStudent.name} ({recentCheckedStudent.classGrade})!
              </div>
              <div className="text-emerald-200 text-[11px]">
                Total Kunjungan: <strong>{recentCheckedStudent.visitCount} kali</strong> (Tercatat di sistem)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2 Columns: Visitor Log & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Visitor Log Table (Excel Spreadsheet Grid) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 font-heading">Sel Spreadsheet Riwayat Presensi</h4>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                  {filteredVisits.length} Baris
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-36 sm:w-44">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari pengunjung..."
                    className="w-full pl-8 pr-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportVisitsCSV}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs shrink-0"
                  title="Ekspor Sel Sel Spreadsheet Kunjungan ke CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-200/90 text-slate-700 text-[11px] font-mono border-b border-slate-300">
                    <th className="w-10 p-1.5 text-center border-r border-slate-300 bg-slate-300/60 font-bold">#</th>
                    <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[140px]">A: Nama Siswa</th>
                    <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[80px]">B: Kelas</th>
                    <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[120px]">C: Waktu Presensi</th>
                    <th className="p-1.5 font-bold text-slate-700 min-w-[120px]">D: Keperluan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada data kunjungan dalam sel spreadsheet.
                      </td>
                    </tr>
                  ) : (
                    filteredVisits.map((v, index) => {
                      const time = new Date(v.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <tr key={v.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="p-1.5 text-center font-mono text-[11px] font-bold bg-slate-100 text-slate-500 border-r border-slate-200 select-none">
                            {index + 1}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-bold text-slate-900">
                            {v.studentName}
                          </td>
                          <td className="p-2 border-r border-slate-200 font-semibold text-indigo-700">
                            {v.studentClass}
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-600 font-mono text-[11px]">
                            {v.dateStr} {time}
                          </td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px] border border-slate-200">
                              {v.purpose || 'Kunjungan'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Leaderboard Reward */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-800 font-heading">
                  Top 10 Pengunjung Teraktif
                </h4>
              </div>
              <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
                Reward
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {leaderboard.slice(0, 10).map((s, idx) => (
                <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <img src={s.photoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                      <div className="font-bold text-xs text-slate-800">{s.name}</div>
                      <div className="text-[10px] text-slate-500">Kelas {s.classGrade}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-xs text-indigo-600 font-heading">
                      {s.visitCount}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">kali</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Pindai Kartu"
        placeholder="Ketik ID Kartu Siswa..."
        onScanSuccess={(code) => {
          handleScanOrSubmit(code);
        }}
      />
    </div>
  );
};
