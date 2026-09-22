import React, { useState, useEffect } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Student } from '../../types';
import { cropToPasfoto3x4 } from '../../lib/imageUtils';
import { uploadImageToDrive } from '../../lib/driveAppsScript';
import {
  IdCard,
  User,
  Calendar,
  MapPin,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Loader2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  BookOpen,
  Phone,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarcodeDisplay } from '../common/BarcodeDisplay';

interface FormulirPendataanSiswaProps {
  onClose?: () => void;
  initialNisn?: string;
  isEmbedInPortal?: boolean;
}

export const FormulirPendataanSiswa: React.FC<FormulirPendataanSiswaProps> = ({
  onClose,
  initialNisn = '',
  isEmbedInPortal = false,
}) => {
  const { students, updateStudent, addStudent, showToast, appsScriptUrl, driveFolderId, logoUrl } = useLibrary();

  // Step 1: Input NISN / Lookup
  const [nisnQuery, setNisnQuery] = useState(initialNisn);
  const [verifiedStudent, setVerifiedStudent] = useState<Student | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Step 2: Form Data
  const [formData, setFormData] = useState({
    name: '',
    classGrade: 'VII-A',
    nisn: '',
    gender: 'L' as 'L' | 'P',
    pob: '', // Tempat Lahir
    dob: '', // Tanggal Lahir (YYYY-MM-DD)
    phone: '',
    photoUrl: '', // Cropped 3x4
  });

  // Photo processing state
  const [rawUploadedPhoto, setRawUploadedPhoto] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedStudent, setSubmittedStudent] = useState<Student | null>(null);

  // Auto-fill if initialNisn is passed or when searching
  useEffect(() => {
    if (initialNisn.trim()) {
      handleLookupNisn(initialNisn.trim());
    }
  }, [initialNisn]);

  const handleLookupNisn = (searchNisn: string) => {
    const cleanNisn = searchNisn.trim();
    if (!cleanNisn) {
      showToast('error', 'NISN Kosong', 'Masukkan 10 digit NISN Anda');
      return;
    }

    setHasSearched(true);
    const found = students.find((s) => s.nisn === cleanNisn || s.id.toLowerCase() === cleanNisn.toLowerCase());

    if (found) {
      setVerifiedStudent(found);
      setIsNotFound(false);
      setFormData({
        name: found.name,
        classGrade: found.classGrade,
        nisn: found.nisn,
        gender: found.gender || 'L',
        pob: found.pob || '',
        dob: found.dob || '',
        phone: found.phone || '',
        photoUrl: found.photoUrl || '',
      });
      showToast('success', 'Data NISN Ditemukan', `Siswa: ${found.name} (${found.classGrade})`);
    } else {
      setVerifiedStudent(null);
      setIsNotFound(true);
      setFormData({
        name: '',
        classGrade: 'VII-A',
        nisn: cleanNisn,
        gender: 'L',
        pob: '',
        dob: '',
        phone: '',
        photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    try {
      showToast('info', 'Memproses Foto', 'Memotong foto otomatis ke rasio 3x4 pasfoto formal...');
      // Auto crop to exact 3x4 aspect ratio (450x600 px)
      const cropped3x4 = await cropToPasfoto3x4(file, 450, 600, 0.9);
      setRawUploadedPhoto(cropped3x4);
      setFormData((prev) => ({ ...prev, photoUrl: cropped3x4 }));
      showToast('success', 'Foto Rapi 3x4', 'Pasfoto formal berhasil dipotong 3x4');
    } catch (err: any) {
      showToast('error', 'Gagal Olah Foto', err.message || 'Gagal memotong foto');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pob.trim() || !formData.dob.trim()) {
      showToast('error', 'Lengkapi Data', 'Tempat dan Tanggal Lahir wajib diisi');
      return;
    }

    if (!formData.photoUrl) {
      showToast('error', 'Foto Belum Ada', 'Unggah pasfoto formal 3x4 terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    let finalDrivePhotoUrl = formData.photoUrl;

    try {
      // Clean student name for filename: PasFoto_NamaSiswa_NISN.jpg
      const cleanName = (formData.name || 'Siswa')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_+/g, '_');
      const autoFileName = `PasFoto_${cleanName}_${formData.nisn || Date.now()}.jpg`;

      // If Apps Script is configured, upload to Google Drive under "Foto Siswa" folder
      if (appsScriptUrl && appsScriptUrl.startsWith('https://script.google.com/')) {
        showToast('info', 'Mengunggah ke Drive', `Menyimpan foto ke Google Drive (${autoFileName})...`);
        const driveRes = await uploadImageToDrive(
          appsScriptUrl,
          formData.photoUrl,
          autoFileName,
          'image/jpeg',
          'students',
          driveFolderId
        );

        if (driveRes.success && driveRes.fileUrl) {
          finalDrivePhotoUrl = driveRes.fileUrl;
          showToast('success', 'Tersimpan di Google Drive', `File: ${autoFileName}`);
        }
      }

      const submissionDate = new Date().toISOString();

      if (verifiedStudent) {
        // Update existing student record
        updateStudent(verifiedStudent.id, {
          name: formData.name,
          classGrade: formData.classGrade,
          gender: formData.gender,
          pob: formData.pob,
          dob: formData.dob,
          phone: formData.phone,
          photoUrl: finalDrivePhotoUrl,
          drivePhotoUrl: finalDrivePhotoUrl,
          cardDataCompleted: true,
          cardDataSubmittedAt: submissionDate,
        });

        const updated = {
          ...verifiedStudent,
          ...formData,
          photoUrl: finalDrivePhotoUrl,
          drivePhotoUrl: finalDrivePhotoUrl,
          cardDataCompleted: true,
          cardDataSubmittedAt: submissionDate,
        };
        setSubmittedStudent(updated);
      } else {
        // Register new student record if not found
        const newStud = addStudent({
          nisn: formData.nisn,
          name: formData.name,
          classGrade: formData.classGrade,
          gender: formData.gender,
          photoUrl: finalDrivePhotoUrl,
          phone: formData.phone,
        });

        // Add additional details
        updateStudent(newStud.id, {
          pob: formData.pob,
          dob: formData.dob,
          drivePhotoUrl: finalDrivePhotoUrl,
          cardDataCompleted: true,
          cardDataSubmittedAt: submissionDate,
        });

        setSubmittedStudent({
          ...newStud,
          pob: formData.pob,
          dob: formData.dob,
          drivePhotoUrl: finalDrivePhotoUrl,
          cardDataCompleted: true,
          cardDataSubmittedAt: submissionDate,
        });
      }

      setIsSubmittedSuccess(true);
      showToast('success', 'Pendataan Kartu Berhasil!', 'Data kartu pustaka berhasil disimpan');
    } catch (err: any) {
      showToast('error', 'Gagal Memproses', err.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-5">
      {/* SUCCESS SCREEN */}
      {isSubmittedSuccess && submittedStudent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-900 font-heading">Formulir Kartu Pustaka Berhasil Disimpan!</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Data anggota dan pasfoto formal 3x4 milik <strong className="text-slate-800">{submittedStudent.name}</strong> telah terdaftar di sistem perpustakaan dan Google Drive.
            </p>
          </div>

          {/* CARD PREVIEW */}
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-5 text-white shadow-xl max-w-md mx-auto text-left relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3">
              <div className="flex items-center gap-2">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="w-7 h-7 rounded-lg object-contain bg-white p-0.5" />
                ) : (
                  <BookOpen className="w-6 h-6 text-emerald-300" />
                )}
                <div>
                  <div className="text-xs font-bold leading-none">SMP NEGERI 1 BENGKALIS</div>
                  <div className="text-[9px] text-indigo-200 uppercase tracking-wider">Perpustakaan Bunga Tanjung</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded border border-emerald-400/30">
                ANGGOTA
              </span>
            </div>

            <div className="flex gap-3.5 items-center">
              <img
                src={submittedStudent.photoUrl}
                alt={submittedStudent.name}
                className="w-16 h-20 object-cover rounded-xl border-2 border-white/30 shrink-0 bg-slate-800 shadow-md"
              />
              <div className="space-y-1 min-w-0">
                <div className="text-sm font-bold truncate">{submittedStudent.name}</div>
                <div className="text-[11px] text-indigo-200">
                  Kelas: <span className="font-semibold text-white">{submittedStudent.classGrade}</span>
                </div>
                <div className="text-[11px] text-indigo-200">
                  TTL: <span className="font-semibold text-white">{submittedStudent.pob}, {submittedStudent.dob}</span>
                </div>
                <div className="text-[11px] text-indigo-200">
                  NISN: <span className="font-semibold text-white font-mono">{submittedStudent.nisn}</span>
                </div>
                <div className="text-[10px] text-indigo-300 font-mono">{submittedStudent.id}</div>
              </div>
            </div>

            <div className="mt-3 pt-2 bg-white rounded-xl p-2 flex justify-center">
              <BarcodeDisplay value={submittedStudent.id} height={30} width={1.3} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu Anggota</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup Formulir
              </button>
            )}
          </div>
        </motion.div>
      ) : (
        /* FORM MAIN CONTAINER */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 p-6 text-white relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                  <IdCard className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-heading">Formulir Pendataan Kartu Pustaka</h2>
                  <p className="text-xs text-indigo-200">Lengkapi data diri & pasfoto 3x4 untuk penerbitan kartu</p>
                </div>
              </div>

              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* STEP 1: LOGIN NISN SEARCH */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                1. Masukkan NISN Siswa untuk Verifikasi Data Admin
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={nisnQuery}
                    onChange={(e) => setNisnQuery(e.target.value)}
                    placeholder="Contoh NISN: 0098765431"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLookupNisn(nisnQuery)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Cek NISN</span>
                </button>
              </div>

              {hasSearched && verifiedStudent && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">{verifiedStudent.name}</span> ({verifiedStudent.classGrade}) — NISN: {verifiedStudent.nisn}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                    Terverifikasi
                  </span>
                </div>
              )}

              {hasSearched && isNotFound && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>NISN belum terdaftar di database admin. Silakan lengkapi nama & kelas mandiri di bawah ini.</span>
                </div>
              )}
            </div>

            {/* STEP 2: FORM DETAILS */}
            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="border-t border-slate-100 pt-4">
                <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>2. Identitas Siswa</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Lengkap Siswa {verifiedStudent && <span className="text-emerald-600 font-normal">(Otomatis Admin)</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nama sesuai akta"
                      disabled={!!verifiedStudent}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                        verifiedStudent
                          ? 'bg-slate-100 border-slate-200 text-slate-700'
                          : 'bg-white border-slate-300 focus:outline-none focus:border-indigo-500'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kelas {verifiedStudent && <span className="text-emerald-600 font-normal">(Otomatis Admin)</span>}
                    </label>
                    {verifiedStudent ? (
                      <input
                        type="text"
                        value={formData.classGrade}
                        disabled
                        className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                      />
                    ) : (
                      <select
                        value={formData.classGrade}
                        onChange={(e) => setFormData({ ...formData, classGrade: e.target.value })}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      >
                        {['VII-A', 'VII-B', 'VIII-A', 'VIII-B', 'IX-A', 'IX-B', 'IX-C'].map((c) => (
                          <option key={c} value={c}>
                            Kelas {c}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tempat Lahir *</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.pob}
                        onChange={(e) => setFormData({ ...formData, pob: e.target.value })}
                        placeholder="Contoh: Bengkalis"
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tanggal Lahir *</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                      className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp / HP</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="08..."
                        className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 3: PASFOTO 3X4 FORMAL WITH AUTO CROP */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-indigo-600" />
                    <span>3. Unggah Pasfoto Formal 3x4 *</span>
                  </h3>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-100">
                    Auto-Crop 3:4 High Quality
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mb-3">
                  Unggah foto formal berbusana seragam sekolah. Sistem akan otomatis memotong foto menjadi rasio standar pasfoto 3x4 (450x600 px) dan memberi nama file otomatis <code className="bg-slate-100 px-1 font-mono text-indigo-700">PasFoto_[Nama]_[NISN].jpg</code> di Google Drive.
                </p>

                <div className="bg-slate-50 border-2 border-dashed border-indigo-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
                  {/* PREVIEW FRAME 3X4 */}
                  <div className="relative shrink-0">
                    <div className="w-28 h-36 bg-slate-200 rounded-xl overflow-hidden border-2 border-indigo-300 shadow-sm relative flex items-center justify-center">
                      {formData.photoUrl ? (
                        <img
                          src={formData.photoUrl}
                          alt="Pasfoto 3x4"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-2 text-slate-400 space-y-1">
                          <User className="w-8 h-8 mx-auto" />
                          <div className="text-[10px] font-bold">Foto 3x4</div>
                        </div>
                      )}

                      {/* 3x4 Grid Overlay Indicator */}
                      <div className="absolute inset-0 border border-white/40 pointer-events-none flex flex-col justify-between p-1">
                        <div className="text-[9px] font-bold text-white bg-black/50 px-1 py-0.5 rounded text-center backdrop-blur-xs">
                          3 x 4
                        </div>
                      </div>

                      {isProcessingPhoto && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1">
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                          <span>Crop 3x4...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* UPLOAD CONTROLS */}
                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="text-xs font-bold text-slate-800">
                      {formData.photoUrl ? 'Pasfoto Formal 3x4 Terpasang' : 'Pilih Berkas Foto Formal'}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Format: JPG, PNG, atau WEBP. Foto dari kamera handphone secara otomatis akan dicrop presisi berasio 3:4.
                    </p>

                    <label className={`inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs ${isProcessingPhoto ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <UploadCloud className="w-4 h-4" />
                      <span>{formData.photoUrl ? 'Ganti Pasfoto 3x4' : 'Unggah & Crop Pasfoto 3x4'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isProcessingPhoto}
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Tersimpan di Sistem & Google Drive</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isProcessingPhoto}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan & Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <span>Simpan & Terbitkan Kartu</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
