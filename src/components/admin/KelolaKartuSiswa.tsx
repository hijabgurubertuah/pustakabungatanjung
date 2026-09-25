import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Student } from '../../types';
import { BarcodeDisplay } from '../common/BarcodeDisplay';
import { ImportAnggotaModal } from './ImportAnggotaModal';
import { FormulirPendataanSiswa } from '../siswa/FormulirPendataanSiswa';
import { RekapPendataanKartuModal } from './RekapPendataanKartuModal';
import { BuatKartu } from './BuatKartu';
import { compressImageFile, cropToPasfoto3x4 } from '../../lib/imageUtils';
import { uploadImageToDrive } from '../../lib/driveAppsScript';
import {
  IdCard,
  Plus,
  Search,
  Printer,
  Edit2,
  Trash2,
  X,
  UploadCloud,
  Check,
  BookOpen,
  Filter,
  Eye,
  FileSpreadsheet,
  HardDrive,
  Loader2,
  UserCheck,
  Share2,
  CheckCircle2,
  AlertCircle,
  Info,
  Users,
} from 'lucide-react';

const CLASSES = ['Semua Kelas', 'VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B', 'IX-C'];

export const KelolaKartuSiswa: React.FC = () => {
  const { students, addStudent, updateStudent, deleteStudent, showToast, logoUrl, appsScriptUrl, driveFolderId, syncCollectionToFirebase } = useLibrary();

  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);

  const handleSyncStudents = async () => {
    setIsSavingToFirebase(true);
    await syncCollectionToFirebase('students');
    setIsSavingToFirebase(false);
  };

  // View Mode: 'cards' | 'spreadsheet' | 'studio'
  const [viewMode, setViewMode] = useState<'cards' | 'spreadsheet' | 'studio'>('spreadsheet');
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isRekapModalOpen, setIsRekapModalOpen] = useState(false);
  const [isFormulirMandiriOpen, setIsFormulirMandiriOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [previewCard, setPreviewCard] = useState<Student | null>(null);
  const [isBatchPrint, setIsBatchPrint] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nisn: '',
    name: '',
    classGrade: 'VII-A',
    gender: 'L' as 'L' | 'P',
    pob: '',
    dob: '',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    phone: '',
    email: '',
  });

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQ =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.nisn.includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.classGrade.toLowerCase().includes(q);

    const matchClass = selectedClass === 'Semua Kelas' || s.classGrade === selectedClass;

    return matchQ && matchClass;
  });

  const openAddModal = () => {
    setEditingStudent(null);
    const randomNisn = '00' + Math.floor(10000000 + Math.random() * 90000000);
    setFormData({
      nisn: randomNisn,
      name: '',
      classGrade: 'VII-A',
      gender: 'L',
      pob: '',
      dob: '',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      phone: '',
      email: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nisn: student.nisn,
      name: student.name,
      classGrade: student.classGrade,
      gender: student.gender,
      pob: student.pob || '',
      dob: student.dob || '',
      photoUrl: student.photoUrl,
      phone: student.phone || '',
      email: student.email || '',
    });
    setIsModalOpen(true);
  };

  const processAndUploadStudentPhoto = async (dataUrl: string, originalFileName?: string) => {
    setIsUploadingPhoto(true);
    try {
      // Auto-crop to exact 3x4 pasfoto ratio (450x600 px)
      const cropped3x4 = await cropToPasfoto3x4(dataUrl, 450, 600, 0.9);

      if (appsScriptUrl && appsScriptUrl.startsWith('https://script.google.com/')) {
        showToast('info', 'Mengunggah ke Drive', 'Mengunggah pasfoto 3x4 ke Google Drive...');
        const cleanName = (formData.name || 'siswa').replace(/[^a-zA-Z0-9]/g, '_');
        const autoFileName = originalFileName || `PasFoto_${cleanName}_${formData.nisn || Date.now()}.jpg`;

        const res = await uploadImageToDrive(appsScriptUrl, cropped3x4, autoFileName, 'image/jpeg', 'students', driveFolderId);
        if (res.success && res.fileUrl) {
          setFormData((prev) => ({ ...prev, photoUrl: res.fileUrl! }));
          showToast('success', 'Tersimpan di Google Drive', `Pasfoto 3x4 disimpan: ${autoFileName}`);
          return;
        }
      }
      setFormData((prev) => ({ ...prev, photoUrl: cropped3x4 }));
      showToast(
        'success',
        'Foto 3x4 Diproses',
        appsScriptUrl ? 'Pasfoto disimpan ke sistem' : 'Hubungkan Apps Script di Sinkronisasi agar foto tersimpan otomatis di Google Drive'
      );
    } catch (err: any) {
      setFormData((prev) => ({ ...prev, photoUrl: dataUrl }));
      showToast('error', 'Gagal Olah Foto', err.message || 'Menggunakan foto asli');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          processAndUploadStudentPhoto(reader.result as string, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nisn) {
      showToast('error', 'Validasi Gagal', 'Lengkapi nama dan NISN');
      return;
    }

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        ...formData,
        cardDataCompleted: !!(formData.pob && formData.dob && formData.photoUrl),
      });
    } else {
      const newStud = addStudent({
        nisn: formData.nisn,
        name: formData.name,
        classGrade: formData.classGrade,
        gender: formData.gender,
        photoUrl: formData.photoUrl,
        phone: formData.phone,
      });
      updateStudent(newStud.id, {
        pob: formData.pob,
        dob: formData.dob,
        cardDataCompleted: !!(formData.pob && formData.dob && formData.photoUrl),
      });
    }
    setIsModalOpen(false);
  };

  if (viewMode === 'studio') {
    return <BuatKartu onBackToMembers={() => setViewMode('spreadsheet')} />;
  }

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa, NISN, ID kartu..."
            className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors"
          />
        </div>

        {/* View Mode Switcher & Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#F5F7FA] p-1 rounded-xl border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setViewMode('spreadsheet')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition select-none ${
                viewMode === 'spreadsheet'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'text-slate-500 hover:text-[#1A1A2E]'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-[#F5A623]" />
              <span>Sel Spreadsheet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition select-none ${
                viewMode === 'cards'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'text-slate-500 hover:text-[#1A1A2E]'
              }`}
            >
              <IdCard className="w-4 h-4 text-[#F5A623]" />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('studio')}
              className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition select-none text-[#1E3A5F] hover:bg-white"
            >
              <Printer className="w-4 h-4 text-[#1E3A5F]" />
              <span>Studio Cetak A4</span>
            </button>
          </div>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="min-h-[44px] px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#1A1A2E] focus:outline-none focus:border-[#1E3A5F] cursor-pointer"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsFormulirMandiriOpen(true)}
            className="min-h-[44px] px-3 py-2 bg-white hover:bg-[#F5F7FA] active:bg-slate-100 text-[#1E3A5F] border border-[#E2E8F0] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Formulir pendataan kartu yang bisa dibagikan ke siswa"
          >
            <UserCheck className="w-4 h-4 text-[#1E3A5F]" />
            <span>Formulir Siswa</span>
          </button>

          <button
            onClick={() => setIsRekapModalOpen(true)}
            className="min-h-[44px] px-3 py-2 bg-white hover:bg-[#F5F7FA] active:bg-slate-100 text-[#1E3A5F] border border-[#E2E8F0] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Lihat rekapitulasi pendataan kartu dan ekspor ke Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Rekap Spreadsheet</span>
          </button>

          <button
            onClick={() => setViewMode('studio')}
            className="min-h-[44px] px-3 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu A4</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="min-h-[44px] px-3 py-2 bg-[#F5F7FA] hover:bg-slate-200 active:bg-slate-300 text-[#1A1A2E] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer border border-[#E2E8F0]"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Impor CSV</span>
          </button>

          <button
            type="button"
            onClick={handleSyncStudents}
            disabled={isSavingToFirebase}
            className="min-h-[44px] px-3.5 py-2 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer disabled:opacity-50"
            title="Sinkronkan data siswa ke Firebase Cloud"
          >
            {isSavingToFirebase ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#F5A623]" />
            ) : (
              <UploadCloud className="w-4 h-4 text-[#F5A623]" />
            )}
            <span>Simpan ke Firebase</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="min-h-[44px] px-3.5 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer select-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN SPREADSHEET (EXCEL/GOOGLE SHEETS GRID VIEW)                     */}
      {/* ========================================================================= */}
      {viewMode === 'spreadsheet' ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {/* Header toolbar Excel */}
          <div className="bg-[#F5F7FA] border-b border-[#E2E8F0] p-2.5 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 text-[#1A1A2E] font-semibold">
              <FileSpreadsheet className="w-4 h-4 text-[#1E3A5F]" />
              <span>Mode Sel Spreadsheet</span>
              <span className="text-[10px] bg-white text-[#1E3A5F] font-bold px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                {filteredStudents.length} Siswa
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddModal}
                className="min-h-[36px] px-3 py-1.5 bg-[#F5A623] hover:bg-[#E09618] text-[#1A1A2E] text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                {/* Letters Header Row (A, B, C, D...) */}
                <tr className="bg-slate-200/80 text-slate-600 text-[11px] font-mono border-b border-slate-300">
                  <th className="w-10 p-1.5 text-center border-r border-slate-300 bg-slate-300/60 font-bold">#</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[130px]">A: NISN</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[180px]">B: Nama Lengkap</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[100px]">C: Kelas</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[80px]">D: JK</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[120px]">E: Tempat Lahir</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[110px]">F: Tgl Lahir</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[120px]">G: No. HP</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[150px]">H: Email</th>
                  <th className="p-1.5 text-center min-w-[100px]">I: Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="w-8 h-8 text-slate-300" />
                        <span className="text-xs font-medium text-slate-600">Tidak ada data siswa ditemukan</span>
                        <button
                          type="button"
                          onClick={openAddModal}
                          className="mt-1 min-h-[40px] px-3.5 py-1.5 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] text-xs font-bold rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah Siswa</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, index) => (
                    <tr key={s.id} className="hover:bg-[#F5F7FA] transition-colors">
                      {/* Row Number Column */}
                      <td className="p-1.5 text-center font-mono text-[11px] font-bold bg-slate-100 text-slate-500 border-r border-slate-200 select-none">
                        {index + 1}
                      </td>

                      {/* NISN Cell */}
                      <td className="p-0 border-r border-slate-200">
                        <input
                          type="text"
                          value={s.nisn}
                          onChange={(e) => updateStudent(s.id, { nisn: e.target.value })}
                          className="w-full h-full px-2 py-1.5 bg-transparent font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 border-none rounded-none text-xs"
                        />
                      </td>

                      {/* Nama Cell */}
                      <td className="p-0 border-r border-slate-200">
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => updateStudent(s.id, { name: e.target.value })}
                          className="w-full h-full px-2 py-1.5 bg-transparent font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none border-none rounded-none text-xs"
                        />
                      </td>

                      {/* Kelas Cell */}
                      <td className="p-0 border-r border-slate-200">
                        <select
                          value={s.classGrade}
                          onChange={(e) => updateStudent(s.id, { classGrade: e.target.value })}
                          className="w-full h-full px-2 py-1.5 bg-transparent font-semibold text-indigo-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none border-none rounded-none text-xs"
                        >
                          {CLASSES.filter((c) => c !== 'Semua Kelas').map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Jenis Kelamin Cell */}
                      <td className="p-0 border-r border-slate-200">
                        <select
                          value={s.gender || 'L'}
                          onChange={(e) => updateStudent(s.id, { gender: e.target.value as 'L' | 'P' })}
                          className="w-full h-full px-2 py-1.5 bg-transparent text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none border-none rounded-none text-xs"
                        >
                          <option value="L">L</option>
                          <option value="P">P</option>
                        </select>
                      </td>

                      {/* POB Cell */}
                      <td className="p-0 border-r border-slate-200">
                        <input
                          type="text"
                          value={s.pob || ''}
                          placeholder="Tempat lahir..."
                          onChange={(e) => updateStudent(s.id, { pob: e.target.value })}
                          className="w-full h-full px-2 py-1.5 bg-transparent text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none border-none rounded-none text-xs"
                        />
                      </td>

                      {/* DOB Cell */}
                      <td className="p-0 border-r border-slate-200">
                        <input
                          type="text"
                          value={s.dob || ''}
                          placeholder="YYYY-MM-DD"
                          onChange={(e) => updateStudent(s.id, { dob: e.target.value })}
                          className="w-full h-full px-2 py-1.5 bg-transparent text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none border-none rounded-none text-xs font-mono"
                        />
                      </td>

                      {/* Phone Cell */}
                      <td className="p-0 border-r border-slate-200">
                        <input
                          type="text"
                          value={s.phone || ''}
                          placeholder="08..."
                          onChange={(e) => updateStudent(s.id, { phone: e.target.value })}
                          className="w-full h-full px-2 py-1.5 bg-transparent text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none border-none rounded-none text-xs font-mono"
                        />
                      </td>

                      {/* Email Cell */}
                      <td className="p-0 border-r border-slate-200">
                        <input
                          type="email"
                          value={s.email || ''}
                          placeholder="email@..."
                          onChange={(e) => updateStudent(s.id, { email: e.target.value })}
                          className="w-full h-full px-2 py-1.5 bg-transparent text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none border-none rounded-none text-xs"
                        />
                      </td>

                      {/* Actions */}
                      <td className="p-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewCard(s)}
                            className="min-h-[32px] min-w-[32px] flex items-center justify-center text-[#1E3A5F] hover:bg-[#F5F7FA] rounded-lg cursor-pointer transition-colors"
                            title="Kartu Siswa"
                          >
                            <IdCard className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(s)}
                            className="p-1 text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                            title="Ubah Lengkap"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteStudent(s.id)}
                            className="p-1 text-rose-500 hover:bg-rose-100 rounded cursor-pointer"
                            title="Hapus Row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Student Cards List / Grid */
        filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-12 text-center">
            <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
              <Users className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-semibold text-[#1A1A2E]">Tidak ada data siswa ditemukan</p>
              <button
                type="button"
                onClick={openAddModal}
                className="mt-2 min-h-[44px] px-4 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 flex flex-col justify-between space-y-3"
              >
                <div className="flex gap-3 items-start">
                  <img
                    src={student.photoUrl}
                    alt=""
                    className="w-14 h-16 object-cover rounded-lg border border-[#E2E8F0] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-[#1A1A2E] text-sm truncate font-heading">{student.name}</h4>
                      <span className="px-2 py-0.5 bg-[#1E3A5F]/10 text-[#1E3A5F] font-bold rounded text-[10px]">
                        {student.classGrade}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-mono">NISN: {student.nisn}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{student.id}</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                      Kunjungan: {student.visitCount}x • Pinjam: {student.activeLoanCount}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                  <button
                    onClick={() => setPreviewCard(student)}
                    className="min-h-[40px] px-3 py-1.5 bg-[#F5F7FA] hover:bg-slate-200 active:bg-slate-300 text-[#1E3A5F] border border-[#E2E8F0] rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <IdCard className="w-4 h-4 text-[#1E3A5F]" />
                    <span>Kartu Anggota</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(student)}
                      className="min-w-[40px] min-h-[40px] p-2 text-slate-500 hover:text-[#1E3A5F] hover:bg-[#F5F7FA] active:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      title="Ubah"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteStudent(student.id)}
                      className="min-w-[40px] min-h-[40px] p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-[#1A1A2E] text-base font-heading">
                {editingStudent ? 'Ubah Data Siswa' : 'Daftarkan Siswa Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A1A2E] mb-1">NISN</label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="cth: 0098765432"
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A1A2E] mb-1">Kelas</label>
                  <select
                    value={formData.classGrade}
                    onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors cursor-pointer"
                  >
                    {CLASSES.filter((c) => c !== 'Semua Kelas').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A2E] mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="cth: Ahmad Fauzi"
                  className="w-full px-3 py-2.5 min-h-[44px] bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A1A2E] mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1A1A2E] mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="cth: 08123456789"
                    className="w-full px-3 py-2.5 min-h-[44px] bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-[#1A1A2E]">Foto Siswa</label>
                  {formData.photoUrl && (formData.photoUrl.includes('googleusercontent.com') || formData.photoUrl.includes('drive.google.com')) && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <HardDrive className="w-3 h-3" />
                      Google Drive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={formData.photoUrl}
                      alt=""
                      className="w-12 h-14 object-cover rounded-lg border border-[#E2E8F0]"
                    />
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs rounded-lg flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      placeholder="cth: https://..."
                      className="w-full px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#1E3A5F] mb-1.5 text-xs text-[#1A1A2E]"
                    />
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F7FA] hover:bg-slate-200 active:bg-slate-300 text-[#1A1A2E] border border-[#E2E8F0] rounded-lg transition-colors text-xs font-semibold ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <UploadCloud className="w-3.5 h-3.5 text-[#1E3A5F]" />
                      <span>{isUploadingPhoto ? 'Mengunggah ke Drive...' : 'Unggah Foto'}</span>
                      <input type="file" accept="image/*" disabled={isUploadingPhoto} onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 bg-[#F5F7FA] hover:bg-slate-200 active:bg-slate-300 text-[#1A1A2E] border border-[#E2E8F0] rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] rounded-xl font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Printable Card Modal */}
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h3 className="font-bold text-[#1A1A2E] text-base font-heading">Kartu Anggota Perpustakaan</h3>
              <button onClick={() => setPreviewCard(null)} className="text-slate-400 hover:text-slate-600 p-1 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Card Graphic */}
            <div className="bg-gradient-to-br from-[#1E3A5F] via-[#142842] to-[#0A1624] rounded-xl p-5 text-white shadow-xl relative overflow-hidden border border-white/10">
              <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt=""
                      className="w-7 h-7 rounded-lg object-contain bg-white/90 p-0.5 border border-white/20"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-[#F5A623]" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold leading-none font-heading">SMP NEGERI 1 BENGKALIS</div>
                    <div className="text-[9px] text-slate-300 mt-0.5 uppercase tracking-wider">Perpustakaan Bunga Tanjung</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-[#F5A623] text-[#1A1A2E] text-[9px] font-bold rounded">
                  SISWA
                </span>
              </div>

              <div className="flex gap-3 items-center">
                <img
                  src={previewCard.photoUrl}
                  alt=""
                  className="w-16 h-20 object-cover rounded-lg border-2 border-white/30 shrink-0 bg-slate-800"
                />
                <div className="space-y-1 min-w-0">
                  <div className="text-sm font-bold truncate font-heading">{previewCard.name}</div>
                  <div className="text-[11px] text-slate-300">Kelas: <span className="text-white font-semibold">{previewCard.classGrade}</span></div>
                  <div className="text-[11px] text-slate-300">NISN: <span className="text-white font-mono font-semibold">{previewCard.nisn}</span></div>
                  <div className="text-[10px] text-[#F5A623] font-mono">{previewCard.id}</div>
                </div>
              </div>

              {/* Barcode */}
              <div className="mt-3 pt-2 bg-white rounded-lg p-2 flex flex-col items-center justify-center">
                <BarcodeDisplay value={previewCard.id} height={32} width={1.4} />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 min-h-[44px] py-2.5 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4 text-[#F5A623]" />
                <span>Cetak Kartu</span>
              </button>
              <button
                onClick={() => setPreviewCard(null)}
                className="min-h-[44px] px-4 py-2.5 bg-[#F5F7FA] hover:bg-slate-200 active:bg-slate-300 text-[#1A1A2E] border border-[#E2E8F0] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Print Modal */}
      {isBatchPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="font-bold text-[#1A1A2E] text-base font-heading">
                  Cetak Lembar Kartu Anggota ({filteredStudents.length} Siswa)
                </h3>
                <p className="text-xs text-slate-500">Format siap cetak standar lembar A4</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="min-h-[44px] px-4 py-2 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4 text-[#F5A623]" />
                  <span>Cetak Sekarang</span>
                </button>
                <button
                  onClick={() => setIsBatchPrint(false)}
                  className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-slate-600 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  className="bg-white border-2 border-slate-300 rounded-xl p-3 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt=""
                          className="w-4 h-4 object-contain shrink-0"
                        />
                      ) : (
                        <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                      )}
                      <div className="text-[11px] font-bold text-slate-800 leading-tight">
                        SMPN 1 BENGKALIS
                      </div>
                    </div>
                    <span className="text-[9px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                      ANGGOTA
                    </span>
                  </div>

                  <div className="flex gap-2.5 items-center">
                    <img
                      src={s.photoUrl}
                      alt=""
                      className="w-12 h-15 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 space-y-0.5 text-[11px]">
                      <div className="font-bold text-slate-900 truncate">{s.name}</div>
                      <div className="text-slate-600">Kelas: <strong>{s.classGrade}</strong></div>
                      <div className="text-slate-600 font-mono">NISN: {s.nisn}</div>
                    </div>
                  </div>

                  <div className="mt-2 pt-1 border-t border-slate-100 flex justify-center">
                    <BarcodeDisplay value={s.id} height={25} width={1.2} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Modal Impor Massal Anggota */}
      <ImportAnggotaModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      {/* Modal Rekap Pendataan Kartu (Spreadsheet) */}
      <RekapPendataanKartuModal
        isOpen={isRekapModalOpen}
        onClose={() => setIsRekapModalOpen(false)}
        onOpenFormulirMandiri={() => {
          setIsRekapModalOpen(false);
          setIsFormulirMandiriOpen(true);
        }}
      />

      {/* Modal Formulir Pendataan Mandiri Siswa */}
      {isFormulirMandiriOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="my-auto w-full">
            <FormulirPendataanSiswa onClose={() => setIsFormulirMandiriOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};
