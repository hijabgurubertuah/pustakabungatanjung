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
      confetti({ particleCount: 20, spread: 45, origin: { y: 0.7 }, ticks: 60 });
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
      <div className="bg-[#1E3A5F] rounded-xl p-5 sm:p-6 text-white shadow-md border border-[#142842]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#F5A623]/20 text-[#F5A623] rounded-lg border border-[#F5A623]/30">
                <UserCheck className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold font-heading">
                Presensi Kunjungan
              </h3>
            </div>
            <p className="text-xs text-blue-200 mt-1">
              Pencatatan kunjungan siswa & akumulasi keaktifan
            </p>
          </div>

          {/* Today Counter Pill */}
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/15 text-center min-h-[44px] flex flex-col justify-center">
            <div className="text-[11px] text-blue-200 font-medium">Hari Ini</div>
            <div className="text-lg font-bold text-[#F5A623] font-heading leading-tight">
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
              placeholder="cth: BT-SMP1-2024-001 / NISN"
              className="w-full min-h-[44px] px-4 py-2.5 bg-white text-[#1A1A2E] rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F5A623] shadow-xs"
              autoFocus
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="Membaca & Meminjam" className="text-slate-900">Membaca & Meminjam</option>
              <option value="Mengerjakan Tugas" className="text-slate-900">Mengerjakan Tugas</option>
              <option value="Akses Komputer" className="text-slate-900">Akses Komputer</option>
              <option value="Diskusi Kelompok" className="text-slate-900">Diskusi Kelompok</option>
            </select>
          </div>

          <div className="md:col-span-3 flex gap-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex-1 min-h-[44px] py-2.5 bg-white/15 hover:bg-white/25 active:bg-white/35 border border-white/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ScanLine className="w-4 h-4 text-[#F5A623]" />
              <span>Pindai</span>
            </button>
            <button
              onClick={() => handleScanOrSubmit()}
              className="px-5 min-h-[44px] bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] font-bold rounded-xl text-xs flex items-center justify-center transition-all shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Recent checked feedback */}
        {recentCheckedStudent && (
          <div className="mt-4 p-3 bg-white/10 border border-white/20 rounded-xl flex items-center gap-3 animate-in fade-in duration-200">
            <img
              src={recentCheckedStudent.photoUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-cover border border-[#F5A623]"
            />
            <div className="text-xs">
              <div className="font-bold text-white">
                {recentCheckedStudent.name} ({recentCheckedStudent.classGrade})
              </div>
              <div className="text-blue-200 text-[11px]">
                Total Kunjungan: <strong className="text-[#F5A623]">{recentCheckedStudent.visitCount} kali</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2 Columns: Visitor Log & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Visitor Log Table */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3.5 bg-[#F5F7FA] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#1E3A5F]" />
                <h4 className="text-xs font-bold text-[#1A1A2E] font-heading">Riwayat Presensi</h4>
                <span className="text-[10px] bg-white text-[#1E3A5F] font-bold px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                  {filteredVisits.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-36 sm:w-44">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="cth: Ahmad"
                    className="w-full min-h-[36px] pl-8 pr-2.5 py-1 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] focus:outline-none focus:border-[#1E3A5F]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportVisitsCSV}
                  className="min-h-[36px] px-3 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#F5F7FA] text-slate-600 text-[11px] font-semibold border-b border-[#E2E8F0]">
                    <th className="w-10 p-2 text-center border-r border-[#E2E8F0] font-bold">#</th>
                    <th className="p-2 border-r border-[#E2E8F0] font-bold text-[#1A1A2E] min-w-[140px]">Nama Siswa</th>
                    <th className="p-2 border-r border-[#E2E8F0] font-bold text-[#1A1A2E] min-w-[80px]">Kelas</th>
                    <th className="p-2 border-r border-[#E2E8F0] font-bold text-[#1A1A2E] min-w-[120px]">Waktu Presensi</th>
                    <th className="p-2 font-bold text-[#1A1A2E] min-w-[120px]">Keperluan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] bg-white">
                  {filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <UserCheck className="w-8 h-8 text-slate-300" />
                          <p className="text-xs text-slate-500 font-medium">Belum ada catatan presensi</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredVisits.map((v, index) => {
                      const time = new Date(v.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <tr key={v.id} className="hover:bg-[#F5F7FA]/70 transition-colors">
                          <td className="p-2 text-center font-mono text-[11px] font-bold text-slate-400 border-r border-[#E2E8F0] select-none">
                            {index + 1}
                          </td>
                          <td className="p-2 border-r border-[#E2E8F0] font-bold text-[#1A1A2E]">
                            {v.studentName}
                          </td>
                          <td className="p-2 border-r border-[#E2E8F0] font-semibold text-[#1E3A5F]">
                            {v.studentClass}
                          </td>
                          <td className="p-2 border-r border-[#E2E8F0] text-slate-600 font-mono text-[11px]">
                            {v.dateStr} {time}
                          </td>
                          <td className="p-2">
                            <span className="px-2 py-0.5 bg-[#F5F7FA] text-[#1A1A2E] rounded-md font-medium text-[11px] border border-[#E2E8F0]">
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
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-3.5 bg-[#F5F7FA] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F5A623]" />
                <h4 className="text-xs font-bold text-[#1A1A2E] font-heading">
                  Top 10 Pengunjung Teraktif
                </h4>
              </div>
              <span className="text-[10px] font-bold bg-[#F5A623]/20 text-[#F5A623] px-2 py-0.5 rounded-md border border-[#F5A623]/30">
                Peringkat
              </span>
            </div>

            <div className="divide-y divide-[#E2E8F0] max-h-96 overflow-y-auto">
              {leaderboard.slice(0, 10).map((s, idx) => (
                <div key={s.id} className="p-3 flex items-center justify-between hover:bg-[#F5F7FA]/70">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0
                          ? 'bg-[#F5A623] text-[#1A1A2E] shadow-xs'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-[#F5F7FA] text-slate-600 border border-[#E2E8F0]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <img src={s.photoUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-[#E2E8F0]" />
                    <div>
                      <div className="font-bold text-xs text-[#1A1A2E]">{s.name}</div>
                      <div className="text-[10px] text-slate-500">Kelas {s.classGrade}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-xs text-[#1E3A5F] font-heading">
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
