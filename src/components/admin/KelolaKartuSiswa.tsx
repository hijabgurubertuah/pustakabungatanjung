import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Student } from '../../types';
import { BarcodeDisplay } from '../common/BarcodeDisplay';
import { ImportAnggotaModal } from './ImportAnggotaModal';
import { FormulirPendataanSiswa } from '../siswa/FormulirPendataanSiswa';
import { RekapPendataanKartuModal } from './RekapPendataanKartuModal';
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
} from 'lucide-react';

const CLASSES = ['Semua Kelas', 'VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B', 'IX-C'];

export const KelolaKartuSiswa: React.FC = () => {
  const { students, addStudent, updateStudent, deleteStudent, showToast, logoUrl, appsScriptUrl, driveFolderId } = useLibrary();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('Semua Kelas');

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

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari siswa, NISN, ID kartu..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsFormulirMandiriOpen(true)}
            className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Formulir pendataan kartu yang bisa dibagikan ke siswa"
          >
            <UserCheck className="w-4 h-4 text-purple-600" />
            <span>Formulir Siswa</span>
          </button>

          <button
            onClick={() => setIsRekapModalOpen(true)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Lihat rekapitulasi pendataan kartu dan ekspor ke Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Rekap Spreadsheet</span>
          </button>

          <button
            onClick={() => {
              setIsBatchPrint(true);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Massal</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span>Impor CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Student Cards List / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col justify-between space-y-3"
          >
            <div className="flex gap-3 items-start">
              <img
                src={student.photoUrl}
                alt=""
                className="w-14 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{student.name}</h4>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px]">
                    {student.classGrade}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">NISN: {student.nisn}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">{student.id}</div>
                <div className="text-[10px] text-emerald-600 font-semibold mt-1">
                  Kunjungan: {student.visitCount}x • Pinjam: {student.activeLoanCount}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setPreviewCard(student)}
                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <IdCard className="w-3.5 h-3.5" />
                <span>Kartu Anggota</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(student)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Ubah"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteStudent(student.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base font-heading">
                {editingStudent ? 'Ubah Data Siswa' : 'Daftarkan Siswa Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NISN</label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="10 digit NISN"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={formData.classGrade}
                    onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
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
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama sesuai akta/rapor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Foto Siswa</label>
                  {formData.photoUrl && (formData.photoUrl.includes('googleusercontent.com') || formData.photoUrl.includes('drive.google.com')) && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      <HardDrive className="w-3 h-3" />
                      Tersimpan di Google Drive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={formData.photoUrl}
                      alt=""
                      className="w-12 h-14 object-cover rounded-xl border border-slate-200"
                    />
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.photoUrl}
                      onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 mb-1 text-[11px]"
                    />
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-[11px] font-medium ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isUploadingPhoto ? 'Mengunggah ke Drive...' : 'Unggah Foto'}</span>
                      <input type="file" accept="image/*" disabled={isUploadingPhoto} onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
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
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-base font-heading">Kartu Anggota Perpustakaan</h3>
              <button onClick={() => setPreviewCard(null)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Card Graphic */}
            <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
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
                      <BookOpen className="w-4 h-4 text-emerald-300" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold leading-none">SMP NEGERI 1 BENGKALIS</div>
                    <div className="text-[9px] text-indigo-200 mt-0.5 uppercase tracking-wider">Perpustakaan Bunga Tanjung</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded border border-emerald-400/30">
                  SISWA
                </span>
              </div>

              <div className="flex gap-3 items-center">
                <img
                  src={previewCard.photoUrl}
                  alt=""
                  className="w-16 h-20 object-cover rounded-xl border-2 border-white/30 shrink-0 bg-slate-800"
                />
                <div className="space-y-1 min-w-0">
                  <div className="text-sm font-bold truncate">{previewCard.name}</div>
                  <div className="text-[11px] text-indigo-200">Kelas: <span className="text-white font-semibold">{previewCard.classGrade}</span></div>
                  <div className="text-[11px] text-indigo-200">NISN: <span className="text-white font-mono font-semibold">{previewCard.nisn}</span></div>
                  <div className="text-[10px] text-indigo-300 font-mono">{previewCard.id}</div>
                </div>
              </div>

              {/* Barcode */}
              <div className="mt-3 pt-2 bg-white rounded-xl p-2 flex flex-col items-center justify-center">
                <BarcodeDisplay value={previewCard.id} height={32} width={1.4} />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Kartu</span>
              </button>
              <button
                onClick={() => setPreviewCard(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
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
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-heading">
                  Cetak Lembar Kartu Anggota ({filteredStudents.length} Siswa)
                </h3>
                <p className="text-xs text-slate-500">Format siap cetak standar lembar A4</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang</span>
                </button>
                <button
                  onClick={() => setIsBatchPrint(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-200">
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
