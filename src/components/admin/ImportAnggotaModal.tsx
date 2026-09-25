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
      <div className="relative bg-white border border-[#E2E8F0] rounded-xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F5F7FA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E3A5F] flex items-center justify-center text-[#F5A623]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A1A2E] text-base font-heading">
                Impor Data Anggota
              </h3>
              <p className="text-xs text-slate-500">
                Unggah berkas CSV atau tempel tabel spreadsheet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-[#1A1A2E] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Quick Action Bar for Template */}
          <div className="bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#1E3A5F]" />
                <h4 className="font-bold text-xs text-[#1A1A2E]">
                  Template Data Anggota
                </h4>
              </div>
              <p className="text-[11px] text-slate-500">
                Gunakan template standar untuk input massal
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadMemberTemplateCSV}
                className="min-h-[44px] px-3.5 py-2 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Unduh CSV</span>
              </button>

              <button
                type="button"
                onClick={openGoogleSheetsTemplate}
                className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#F5F7FA] active:bg-slate-200 text-[#1A1A2E] border border-[#E2E8F0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Spreadsheet</span>
              </button>

              <button
                type="button"
                onClick={handleCopyTemplate}
                className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#F5F7FA] active:bg-slate-200 text-[#1A1A2E] border border-[#E2E8F0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[#10B981] font-bold">Disalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Salin Format</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mode Tabs: Upload vs Paste */}
          <div className="flex border-b border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`min-h-[44px] px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'border-[#1E3A5F] text-[#1E3A5F]'
                  : 'border-transparent text-slate-500 hover:text-[#1A1A2E]'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Unggah Berkas CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`min-h-[44px] px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'paste'
                  ? 'border-[#1E3A5F] text-[#1E3A5F]'
                  : 'border-transparent text-slate-500 hover:text-[#1A1A2E]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tempel Teks Spreadsheet</span>
            </button>
          </div>

          {/* Tab 1: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E2E8F0] hover:border-[#1E3A5F] bg-[#F5F7FA] hover:bg-white rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all text-center group min-h-[140px]"
              >
                <div className="w-12 h-12 rounded-xl bg-white text-[#1E3A5F] flex items-center justify-center mb-3 shadow-xs border border-[#E2E8F0] group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-[#1A1A2E] text-sm">
                  {fileName ? fileName : 'Pilih berkas CSV'}
                </h5>
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
              <textarea
                value={pastedText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder="cth: NISN&#9;Nama Siswa&#9;Kelas&#9;Gender..."
                rows={5}
                className="w-full px-3.5 py-2.5 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl font-mono text-xs text-[#1A1A2E] focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-all"
              />
            </div>
          )}

          {/* Options & Stats Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F5F7FA] p-3.5 rounded-xl border border-[#E2E8F0]">
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Terdeteksi: </span>
                    <strong className="text-[#1A1A2E] font-bold">{parsedRows.length} baris</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Valid: </span>
                    <strong className="text-[#10B981] font-bold">{validRows.length} data</strong>
                  </div>
                  {existingCount > 0 && (
                    <div>
                      <span className="text-slate-500">Sudah Terdaftar: </span>
                      <strong className="text-[#F59E0B] font-bold">{existingCount} anggota</strong>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#1A1A2E] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="rounded text-[#1E3A5F] focus:ring-[#1E3A5F]"
                  />
                  <span>Perbarui data jika NISN/ID sudah ada</span>
                </label>
              </div>

              {/* Preview Table */}
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-2xs max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#F5F7FA] text-slate-600 font-bold uppercase text-[10px] sticky top-0 border-b border-[#E2E8F0]">
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
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {parsedRows.map((row) => (
                      <tr
                        key={row.index}
                        className={`hover:bg-[#F5F7FA]/80 transition-colors ${
                          !row.isValid
                            ? 'bg-rose-50/50'
                            : row.isExisting
                            ? 'bg-amber-50/30'
                            : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-slate-400">{row.index}</td>
                        <td className="px-3 py-2 font-mono font-semibold text-[#1A1A2E]">
                          {row.nisn}
                        </td>
                        <td className="px-3 py-2 font-medium text-[#1A1A2E]">{row.name}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              row.memberType === 'Guru'
                                ? 'bg-[#F5F7FA] text-[#1E3A5F] border border-[#E2E8F0]'
                                : row.memberType === 'Staf'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#10B981] font-bold">
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2E8F0] bg-[#F5F7FA] shrink-0">
          <div className="text-xs text-slate-500">
            {validRows.length > 0 && (
              <span>
                <strong>{validRows.length}</strong> anggota ({newCount} baru, {existingCount} perbarui)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 bg-white hover:bg-[#F5F7FA] text-[#1A1A2E] border border-[#E2E8F0] rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={validRows.length === 0}
              className="min-h-[44px] px-5 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] disabled:bg-[#E2E8F0] disabled:text-slate-400 text-[#1A1A2E] rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed select-none"
            >
              <Check className="w-4 h-4" />
              <span>Simpan {validRows.length} Anggota</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
