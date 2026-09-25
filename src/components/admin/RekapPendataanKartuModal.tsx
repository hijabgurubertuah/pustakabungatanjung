import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Student } from '../../types';
import { syncDataToGoogleSheets } from '../../lib/driveAppsScript';
import {
  FileSpreadsheet,
  X,
  Download,
  Share2,
  Copy,
  Check,
  HardDrive,
  Search,
  Filter,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

interface RekapPendataanKartuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFormulirMandiri: () => void;
}

export const RekapPendataanKartuModal: React.FC<RekapPendataanKartuModalProps> = ({
  isOpen,
  onClose,
  onOpenFormulirMandiri,
}) => {
  const { students, showToast, appsScriptUrl, books, transactions, visits } = useLibrary();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'lengkap' | 'belum'>('semua');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  if (!isOpen) return null;

  // Filter students
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQ =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.nisn.includes(q) ||
      s.classGrade.toLowerCase().includes(q) ||
      (s.pob && s.pob.toLowerCase().includes(q));

    const isLengkap = !!(s.cardDataCompleted || (s.pob && s.dob && s.photoUrl));
    const matchStatus =
      filterStatus === 'semua' ||
      (filterStatus === 'lengkap' && isLengkap) ||
      (filterStatus === 'belum' && !isLengkap);

    return matchQ && matchStatus;
  });

  const totalLengkap = students.filter((s) => s.cardDataCompleted || (s.pob && s.dob && s.photoUrl)).length;
  const totalBelum = students.length - totalLengkap;

  // Copy Public Form Link
  const handleCopyFormLink = () => {
    const currentUrl = window.location.origin + window.location.pathname + '#formulir-kartu';
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    showToast('success', 'Tautan Disalin', 'Tautan Formulir Pendataan Siswa berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Export CSV Spreadsheet
  const handleExportCSV = () => {
    const headers = [
      'No',
      'NISN',
      'Nama Lengkap',
      'Kelas',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'No HP/WA',
      'Status Pendataan Kartu',
      'Tanggal Submit',
      'Link Foto Google Drive',
      'Foto Base64 Data URL',
    ];

    const rows = students.map((s, idx) => {
      const isLengkap = s.cardDataCompleted || (s.pob && s.dob && s.photoUrl) ? 'LENGKAP' : 'BELUM LENGKAP';
      const isBase64 = s.photoUrl && s.photoUrl.startsWith('data:image/');
      const driveUrl = s.drivePhotoUrl || (!isBase64 ? s.photoUrl : '-');
      const base64Str = isBase64 ? s.photoUrl : '-';

      return [
        idx + 1,
        `"${s.nisn}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.classGrade}"`,
        `"${s.gender || 'L'}"`,
        `"${(s.pob || '-').replace(/"/g, '""')}"`,
        `"${s.dob || '-'}"`,
        `"${s.phone || '-'}"`,
        `"${isLengkap}"`,
        `"${s.cardDataSubmittedAt || s.joinedAt}"`,
        `"${driveUrl}"`,
        `"${base64Str.substring(0, 80)}..."`, // clean short preview or full
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rekap_Pendataan_Kartu_Siswa_SMPN1Bengkalis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Spreadsheet Diunduh', 'Rekap pendataan kartu berhasil diunduh sebagai file CSV');
  };

  // Sync Rekap directly to Google Sheets
  const handleSyncToSheets = async () => {
    if (!appsScriptUrl) {
      showToast('error', 'Apps Script Belum Diatur', 'Hubungkan Web App Apps Script di menu Sinkronisasi');
      return;
    }

    setIsSyncingSheets(true);
    try {
      showToast('info', 'Mengirim ke Google Sheets', 'Mengunggah rekap pendataan kartu ke Google Sheets...');
      const res = await syncDataToGoogleSheets(appsScriptUrl, {
        books,
        students,
        transactions,
        visits,
      });

      if (res.success) {
        showToast('success', 'Google Sheets Terbarui', 'Rekap pendataan kartu siswa berhasil diperbarui di Google Sheets');
        if (res.spreadsheetUrl) {
          window.open(res.spreadsheetUrl, '_blank');
        }
      } else {
        showToast('error', 'Gagal Sync Sheets', res.error || 'Terjadi kesalahan');
      }
    } catch (err: any) {
      showToast('error', 'Gagal Sync Sheets', err.message || 'Koneksi Apps Script terputus');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* MODAL HEADER */}
        <div className="bg-[#1E3A5F] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 text-[#F5A623] rounded-xl flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-heading">Rekap Pendataan Kartu Pustaka</h3>
              <p className="text-xs text-blue-200">Rekapitulasi data anggota perpustakaan</p>
            </div>
          </div>

          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTROLS & STATS BAR */}
        <div className="p-4 bg-[#F5F7FA] border-b border-[#E2E8F0] space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* STATS BADGES */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#1A1A2E] shadow-2xs">
                Total Siswa: <strong className="text-[#1E3A5F]">{students.length}</strong>
              </span>
              <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-[#10B981] shadow-2xs">
                Lengkap: <strong>{totalLengkap}</strong>
              </span>
              <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-[#F59E0B] shadow-2xs">
                Belum: <strong>{totalBelum}</strong>
              </span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyFormLink}
                className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#F5F7FA] text-[#1E3A5F] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-[#E2E8F0] transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Share2 className="w-3.5 h-3.5 text-[#1E3A5F]" />}
                <span>{copiedLink ? 'Tersalin' : 'Bagikan Link'}</span>
              </button>

              <button
                onClick={onOpenFormulirMandiri}
                className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#F5F7FA] text-[#1A1A2E] text-xs font-bold rounded-xl flex items-center gap-1.5 border border-[#E2E8F0] transition-all cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Formulir Siswa</span>
              </button>

              <button
                onClick={handleSyncToSheets}
                disabled={isSyncingSheets}
                className="min-h-[44px] px-3.5 py-2 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSyncingSheets ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <HardDrive className="w-3.5 h-3.5 text-[#F5A623]" />
                )}
                <span>Kirim ke Sheets</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="min-h-[44px] px-4 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor CSV</span>
              </button>
            </div>
          </div>

          {/* SEARCH & FILTER */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="cth: Ahmad / 0098765431"
                className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] focus:outline-none focus:border-[#1E3A5F]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="min-h-[44px] px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#1A1A2E] focus:outline-none"
              >
                <option value="semua">Semua Status</option>
                <option value="lengkap">Lengkap (Pasfoto 3x4)</option>
                <option value="belum">Belum Lengkap</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-slate-600 font-bold sticky top-0 z-10">
                <th className="py-2.5 px-3">Pasfoto 3x4</th>
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3">NISN / Kelas</th>
                <th className="py-2.5 px-3">Tempat & Tgl Lahir</th>
                <th className="py-2.5 px-3">Status Data</th>
                <th className="py-2.5 px-3">Link Drive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada data siswa yang cocok
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isLengkap = !!(student.cardDataCompleted || (student.pob && student.dob && student.photoUrl));
                  const isDrive = student.photoUrl && (student.photoUrl.includes('googleusercontent.com') || student.photoUrl.includes('drive.google.com'));

                  return (
                    <tr key={student.id} className="hover:bg-[#F5F7FA]/70">
                      <td className="py-2.5 px-3">
                        <img
                          src={student.photoUrl}
                          alt=""
                          className="w-10 h-13 object-cover rounded-lg border border-[#E2E8F0] shadow-2xs bg-slate-100"
                        />
                      </td>

                      <td className="py-2.5 px-3 font-bold text-[#1A1A2E]">
                        <div>{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{student.id}</div>
                      </td>

                      <td className="py-2.5 px-3 text-[#1A1A2E]">
                        <div className="font-mono font-semibold">{student.nisn}</div>
                        <span className="inline-block px-1.5 py-0.5 bg-[#F5F7FA] text-[#1E3A5F] font-bold rounded text-[10px] mt-0.5 border border-[#E2E8F0]">
                          {student.classGrade}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-700">
                        {student.pob || student.dob ? (
                          <div>
                            <div className="font-medium text-[#1A1A2E]">{student.pob || '-'}</div>
                            <div className="text-[10px] text-slate-400">{student.dob || '-'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum diisi</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        {isLengkap ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-md text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            Lengkap
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-md text-[10px]">
                            <AlertCircle className="w-3 h-3" />
                            Belum
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 max-w-[220px] truncate">
                        {isDrive ? (
                          <a
                            href={student.photoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#1E3A5F] hover:underline text-[11px] font-medium flex items-center gap-1 truncate"
                          >
                            <HardDrive className="w-3 h-3 shrink-0 text-[#10B981]" />
                            <span className="truncate">Google Drive</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : student.photoUrl ? (
                          <span className="text-slate-500 font-mono text-[10px] truncate block" title={student.photoUrl}>
                            Base64
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-[#F5F7FA] border-t border-[#E2E8F0] flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white rounded-xl text-xs font-bold cursor-pointer transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
