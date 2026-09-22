import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  Users,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  downloadMemberTemplateCSV,
  copyTemplateToClipboard,
  parseMemberCSV,
  ParsedMemberRow,
} from '../../lib/csvHelper';
import { Student } from '../../types';
import { useLibrary } from '../../context/LibraryContext';

export interface ImportAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingStudents?: Student[];
  onImportSuccess?: (importedCount: number, updatedCount: number) => void;
}

export const ImportAnggotaModal: React.FC<ImportAnggotaModalProps> = ({
  isOpen,
  onClose,
  existingStudents: propStudents,
  onImportSuccess,
}) => {
  const { students: contextStudents, importStudentsBulk } = useLibrary();
  const existingStudents = propStudents || contextStudents;

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedMemberRow[]>([]);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseMemberCSV(text, existingStudents);
      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (text: string) => {
    setPastedText(text);
    const rows = parseMemberCSV(text, existingStudents);
    setParsedRows(rows);
  };

  const handleCopyTemplate = async () => {
    const success = await copyTemplateToClipboard();
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const openGoogleSheetsTemplate = () => {
    // Open Google Sheets with template prompt
    window.open('https://docs.google.com/spreadsheets/u/0/create', '_blank');
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const existingCount = validRows.filter((r) => r.isExisting).length;
  const newCount = validRows.length - existingCount;

  const handleExecuteImport = async () => {
    if (validRows.length === 0) return;

    // Convert parsed rows to Student records
    const nowYear = new Date().getFullYear();
    const studentsToSave: (Omit<Student, 'visitCount' | 'activeLoanCount'> & { id?: string })[] = [];

    validRows.forEach((row, idx) => {
      if (row.isExisting && !updateExisting) {
        // Skip duplicate
        return;
      }

      // Check if existing
      const existing = existingStudents.find(
        (s) => s.nisn.trim().toLowerCase() === row.nisn.trim().toLowerCase()
      );

      const studentId = existing
        ? existing.id
        : `BT-SMP1-${nowYear}-${String(existingStudents.length + idx + 1).padStart(3, '0')}`;

      studentsToSave.push({
        id: studentId,
        nisn: row.nisn,
        name: row.name,
        classGrade: row.classGrade,
        gender: row.gender,
        photoUrl: existing?.photoUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        phone: row.phone || existing?.phone || '',
        email: row.email || existing?.email || '',
        joinedAt: existing?.joinedAt || new Date().toISOString().split('T')[0],
      });
    });

    await importStudentsBulk(studentsToSave, updateExisting);

    if (onImportSuccess) {
      onImportSuccess(newCount, existingCount);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="relative bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Impor Data Anggota Massal
              </h3>
              <p className="text-xs text-slate-500">
                Unggah berkas CSV atau tempel tabel Excel/Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Quick Action Bar for Template */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-xs text-emerald-950">
                  Template Data Anggota (Siswa, Guru, Staf)
                </h4>
              </div>
              <p className="text-[11px] text-emerald-800/80">
                Unduh template CSV atau gunakan Google Spreadsheet untuk mengisi data massal
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadMemberTemplateCSV}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template CSV</span>
              </button>

              <button
                type="button"
                onClick={openGoogleSheetsTemplate}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Buka Google Spreadsheet baru untuk input data"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                <span>Buka Spreadsheet</span>
              </button>

              <button
                type="button"
                onClick={handleCopyTemplate}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Salin judul kolom ke clipboard"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Kolom</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mode Tabs: Upload vs Paste */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah Berkas CSV (.csv)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'paste'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tempel Teks Excel / Spreadsheet</span>
            </button>
          </div>

          {/* Tab 1: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center group"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-slate-800 text-sm">
                  {fileName ? fileName : 'Pilih atau Tarik Berkas CSV ke Sini'}
                </h5>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Format yang didukung: <strong>.csv</strong> yang diekspor dari Excel atau Google Sheets (pemisah koma atau titik koma).
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Direct Paste from Excel */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Tempel (Paste Ctrl+V) baris dari Excel / Google Sheets di sini:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={`NISN\tNama Lengkap\tTipe\tKelas\tGender\tNo HP\tEmail\n0081234567\tAhmad Fauzi\tSiswa\tVII-A\tL\t081234567890\t...\n0087654321\tSiti Nurhaliza\tSiswa\tVII-B\tP\t081398765432\t...`}
                rows={5}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
              <p className="text-[11px] text-slate-400">
                Tip: Salin kolom langsung dari Excel atau Google Spreadsheet, lalu tekan Ctrl+V pada kotak di atas.
              </p>
            </div>
          )}

          {/* Options & Stats Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Terdeteksi: </span>
                    <strong className="text-slate-900 font-bold">{parsedRows.length} baris</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Valid: </span>
                    <strong className="text-emerald-600 font-bold">{validRows.length} data</strong>
                  </div>
                  {existingCount > 0 && (
                    <div>
                      <span className="text-slate-500">Sudah Terdaftar: </span>
                      <strong className="text-amber-600 font-bold">{existingCount} anggota</strong>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Perbarui data jika NISN/ID sudah ada</span>
                </label>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">No</th>
                      <th className="px-3 py-2">NISN / NIP</th>
                      <th className="px-3 py-2">Nama Lengkap</th>
                      <th className="px-3 py-2">Tipe</th>
                      <th className="px-3 py-2">Kelas/Jabatan</th>
                      <th className="px-3 py-2">Gender</th>
                      <th className="px-3 py-2">No WhatsApp</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.index}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !row.isValid
                            ? 'bg-rose-50/50'
                            : row.isExisting
                            ? 'bg-amber-50/30'
                            : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-slate-400">{row.index}</td>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-800">
                          {row.nisn}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900">{row.name}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              row.memberType === 'Guru'
                                ? 'bg-indigo-50 text-indigo-700'
                                : row.memberType === 'Staf'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {row.memberType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{row.classGrade}</td>
                        <td className="px-3 py-2 font-bold text-slate-600">{row.gender}</td>
                        <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">
                          {row.phone || '-'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {!row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-bold">
                              <AlertCircle className="w-3 h-3" />
                              <span>{row.validationError}</span>
                            </span>
                          ) : row.isExisting ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-bold">
                              <span>Perbarui</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Baru</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <div className="text-xs text-slate-500">
            {validRows.length > 0 && (
              <span>
                Siap mengimpor <strong>{validRows.length}</strong> anggota ({newCount} baru, {existingCount} pembaruan)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={validRows.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Sinkronkan {validRows.length} Anggota</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
