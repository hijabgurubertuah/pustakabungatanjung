import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  Cloud,
  HardDrive,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Database,
  ExternalLink,
  ShieldAlert,
  Code,
  Folder,
  Send,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
  IdCard,
} from 'lucide-react';
import {
  APPS_SCRIPT_CODE,
  testAppsScriptConnection,
  uploadLogoToDrive,
  batchUploadImagesToDrive,
  syncDataToGoogleSheets,
} from '../../lib/driveAppsScript';
import { firebaseInfo, testFirestoreConnection } from '../../lib/firebase';

export const SinkronisasiDrive: React.FC = () => {
  const {
    currentUser,
    logoUrl,
    appsScriptUrl,
    driveFolderId,
    updateLogo,
    updateAppsScriptSettings,
    syncAllToFirebase,
    isFirebaseConnected,
    lastSyncedAt,
    books,
    students,
    transactions,
    visits,
    showToast,
    syncMeta,
    checkDeltaSync,
    isSyncChecking,
    updateBook,
    updateStudent,
  } = useLibrary();

  const isSuperAdmin = currentUser?.role === 'superadmin';

  // State Apps Script Configuration
  const [scriptUrlInput, setScriptUrlInput] = useState(appsScriptUrl);
  const [folderIdInput, setFolderIdInput] = useState(driveFolderId);
  const [isTestingScript, setIsTestingScript] = useState(false);
  const [scriptTestResult, setScriptTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // State Code Copy
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // State Logo Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [directUrlInput, setDirectUrlInput] = useState('');

  // State Image Migration
  const [isMigratingImages, setIsMigratingImages] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{ total: number; current: number; successCount: number } | null>(null);

  // State Sync Actions
  const [isSyncingFirebase, setIsSyncingFirebase] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [testingFirebase, setTestingFirebase] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<string>(
    isFirebaseConnected ? 'Terhubung' : 'Siap Terhubung'
  );

  // Handle Logo File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Format Tidak Didukung', 'Harap pilih file gambar (PNG, JPG, SVG, WEBP)');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload Logo to Google Drive via Apps Script
  const handleUploadLogoToDrive = async () => {
    if (!isSuperAdmin) {
      showToast('error', 'Akses Terbatas', 'Hanya Super Admin yang dapat mengganti logo');
      return;
    }

    if (!selectedFile || !previewImage) {
      showToast('warning', 'Pilih File', 'Silakan pilih gambar logo terlebih dahulu');
      return;
    }

    // Jika Apps Script URL belum dikonfigurasi, simpan langsung secara lokal/Firestore sebagai Data URL
    if (!scriptUrlInput || !scriptUrlInput.startsWith('https://script.google.com/')) {
      setIsUploadingLogo(true);
      await updateLogo(previewImage);
      setIsUploadingLogo(false);
      setSelectedFile(null);
      setPreviewImage(null);
      showToast('info', 'Tersimpan ke Sistem', 'Logo disimpan langsung ke Firebase. Hubungkan Google Apps Script untuk otomatis simpan di Drive');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const res = await uploadLogoToDrive(
        scriptUrlInput,
        previewImage,
        selectedFile.name,
        selectedFile.type,
        folderIdInput
      );

      if (res.success && res.fileUrl) {
        await updateLogo(res.fileUrl);
        showToast('success', 'Logo Berhasil Diunggah ke Drive', 'Tersimpan di Google Drive dan diterapkan di seluruh aplikasi');
        setSelectedFile(null);
        setPreviewImage(null);
      } else {
        showToast('error', 'Gagal Unggah ke Drive', res.error || 'Periksa koneksi Google Apps Script');
      }
    } catch (err: any) {
      showToast('error', 'Error Upload', err.message || 'Gagal mengunggah gambar');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Save Direct URL Logo
  const handleSaveDirectUrl = async () => {
    if (!isSuperAdmin) {
      showToast('error', 'Akses Terbatas', 'Hanya Super Admin yang dapat mengganti logo');
      return;
    }
    if (!directUrlInput.trim()) return;
    await updateLogo(directUrlInput.trim());
    setDirectUrlInput('');
  };

  // Test Apps Script Connection
  const handleTestAppsScript = async () => {
    setIsTestingScript(true);
    setScriptTestResult(null);
    const result = await testAppsScriptConnection(scriptUrlInput);
    setScriptTestResult(result);
    setIsTestingScript(false);
    if (result.success) {
      showToast('success', 'Apps Script Terhubung', result.message);
    } else {
      showToast('error', 'Koneksi Gagal', result.message);
    }
  };

  // Save Script Settings
  const handleSaveSettings = async () => {
    await updateAppsScriptSettings(scriptUrlInput.trim(), folderIdInput.trim());
  };

  // Copy Code to Clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedCode(true);
    showToast('success', 'Kode Disalin', 'Kode Google Apps Script siap ditempel di editor script.google.com');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Hitung jumlah gambar yang saat ini format Base64 vs URL Drive/Web
  const base64BooksCount = books.filter((b) => b.coverUrl && b.coverUrl.startsWith('data:image/')).length;
  const base64StudentsCount = students.filter((s) => s.photoUrl && s.photoUrl.startsWith('data:image/')).length;
  const totalBase64Count = base64BooksCount + base64StudentsCount;

  // Migrasikan Semua Gambar Base64 ke Google Drive melalui Apps Script
  const handleMigrateAllImagesToDrive = async () => {
    if (!scriptUrlInput || !scriptUrlInput.startsWith('https://script.google.com/')) {
      showToast('error', 'Apps Script Belum Diatur', 'Harap simpan dan uji URL Google Apps Script terlebih dahulu');
      return;
    }

    const base64Books = books.filter((b) => b.coverUrl && b.coverUrl.startsWith('data:image/'));
    const base64Students = students.filter((s) => s.photoUrl && s.photoUrl.startsWith('data:image/'));
    const total = base64Books.length + base64Students.length;

    if (total === 0) {
      showToast('info', 'Semua Gambar Aman', 'Tidak ada gambar Base64. Semua data sudah sangat ringan menggunakan URL hosting.');
      return;
    }

    setIsMigratingImages(true);
    setMigrationProgress({ total, current: 0, successCount: 0 });

    try {
      const items: Array<{ id: string; base64Data: string; fileName: string; category: 'covers' | 'students' }> = [
        ...base64Books.map((b) => ({
          id: b.id,
          base64Data: b.coverUrl,
          fileName: `cover-${b.barcode || b.id}.jpg`,
          category: 'covers' as const,
        })),
        ...base64Students.map((s) => ({
          id: s.id,
          base64Data: s.photoUrl,
          fileName: `siswa-${s.nisn || s.id}.jpg`,
          category: 'students' as const,
        })),
      ];

      let successCount = 0;
      const batchSize = 4;

      for (let i = 0; i < items.length; i += batchSize) {
        const chunk = items.slice(i, i + batchSize);
        const res = await batchUploadImagesToDrive(scriptUrlInput, chunk, folderIdInput);

        if (res.success && res.results) {
          for (const itemRes of res.results) {
            if (itemRes.success && itemRes.fileUrl) {
              successCount++;
              if (itemRes.category === 'covers') {
                updateBook(itemRes.id, { coverUrl: itemRes.fileUrl });
              } else if (itemRes.category === 'students') {
                updateStudent(itemRes.id, { photoUrl: itemRes.fileUrl });
              }
            }
          }
        }
        setMigrationProgress({ total, current: Math.min(items.length, i + batchSize), successCount });
      }

      showToast(
        'success',
        'Migrasi Gambar Berhasil',
        `${successCount} gambar berhasil dipindahkan ke Google Drive. Ukuran dokumen Firestore kini sangat hemat & ringan!`
      );
    } catch (err: any) {
      showToast('error', 'Gagal Migrasi', err.message || 'Terjadi kesalahan saat mengunggah gambar ke Drive');
    } finally {
      setIsMigratingImages(false);
      setMigrationProgress(null);
    }
  };

  // Sync Data to Google Sheets via Drive
  const handleSyncToSheets = async () => {
    if (!scriptUrlInput) {
      showToast('warning', 'Apps Script Belum Diatur', 'Masukkan URL Web App Apps Script terlebih dahulu');
      return;
    }
    setIsSyncingSheets(true);
    try {
      const res = await syncDataToGoogleSheets(scriptUrlInput, {
        books,
        students,
        transactions,
        visits,
      });

      if (res.success) {
        showToast('success', 'Cadangan Selesai', 'Data katalog, siswa, dan transaksi berhasil ditulis ke Google Sheets di Google Drive Anda');
      } else {
        showToast('error', 'Gagal Sinkronisasi', res.error || 'Terjadi kesalahan saat sinkronisasi');
      }
    } catch (e: any) {
      showToast('error', 'Gagal', e.message);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Sync to Firebase
  const handleSyncToFirebase = async () => {
    setIsSyncingFirebase(true);
    await syncAllToFirebase();
    setIsSyncingFirebase(false);
  };

  // Test Firebase
  const handleTestFirebase = async () => {
    setTestingFirebase(true);
    const res = await testFirestoreConnection();
    setTestingFirebase(false);
    setFirebaseStatus(res.success ? 'Terhubung' : 'Gagal Terhubung');
    if (res.success) {
      showToast('success', 'Firestore Aktif', res.message);
    } else {
      showToast('error', 'Firestore Terputus', res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading">
              Sinkronisasi Cloud Drive & Firebase
            </h2>
            <p className="text-xs text-slate-500">
              Pengelolaan logo resmi, pencadangan Google Drive via Apps Script, dan database Firebase
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Firebase Aktif
          </span>
          <button
            onClick={() => setShowCodeModal(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Kode Apps Script</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Pengaturan Logo Sekolah (Khusus Super Admin) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Logo Perpustakaan & Sekolah
                </h3>
              </div>
              {isSuperAdmin ? (
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-200">
                  Super Admin
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-md border border-amber-200 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Hanya Super Admin
                </span>
              )}
            </div>

            {/* Logo Saat Ini */}
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs rounded-lg">
                    SMP 1
                  </div>
                )}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {logoUrl ? 'Logo Kustom Tersimpan' : 'Logo Default Sistem (Bunga Tanjung)'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {logoUrl ? logoUrl : 'SMP Negeri 1 Bengkalis'}
                </div>
                {isSuperAdmin && logoUrl && (
                  <button
                    onClick={() => updateLogo('')}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-medium hover:underline"
                  >
                    Kembalikan ke Default
                  </button>
                )}
              </div>
            </div>

            {/* Area Unggah ke Drive */}
            {isSuperAdmin ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Unggah Berkas Logo Baru ke Google Drive
                  </label>
                  <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-indigo-50/30 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-700">
                      {selectedFile ? selectedFile.name : 'Pilih atau Tarik Berkas Logo'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG, SVG atau WEBP (Maks. 5 MB)
                    </span>
                  </label>
                </div>

                {/* Pratinjau Berkas Terpilih */}
                {previewImage && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-10 h-10 object-contain rounded-lg bg-white border border-indigo-200 p-0.5"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-indigo-950 truncate max-w-[180px]">
                          {selectedFile?.name}
                        </div>
                        <div className="text-[10px] text-indigo-600">
                          Siap diunggah ke Google Drive
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleUploadLogoToDrive}
                      disabled={isUploadingLogo}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {isUploadingLogo ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengunggah...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Unggah ke Drive</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Alternatif: Tautan URL Langsung */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Atau Masukkan Tautan Gambar Langsung (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://.../logo.png"
                      value={directUrlInput}
                      onChange={(e) => setDirectUrlInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      onClick={handleSaveDirectUrl}
                      disabled={!directUrlInput.trim()}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold disabled:opacity-40"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 text-slate-500 rounded-xl text-xs text-center">
                Perubahan logo perpustakaan memerlukan wewenang akun Super Admin.
              </div>
            )}
          </div>

          {/* Card Penyimpanan Gambar Google Drive & Migrasi Massal (Hemat Kuota Firestore) */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md space-y-4 border border-indigo-800/40">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                  <HardDrive className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    Penyimpanan Gambar Google Drive
                  </h3>
                  <p className="text-[10px] text-indigo-200">
                    Otomatis unggah cover buku & foto siswa ke Drive (Hemat Kuota Firestore 100%)
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-400/30">
                Drive Cloud
              </span>
            </div>

            <div className="text-xs text-indigo-100 space-y-2 bg-white/5 p-3 rounded-xl border border-white/10">
              <p className="leading-relaxed">
                Setiap kali Anda memfoto atau mengunggah <strong>sampul buku</strong> dan <strong>foto siswa</strong>, sistem otomatis mengunggahnya ke Google Drive melalui Google Apps Script.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-[10px] text-indigo-300 block font-medium">Folder Sampul:</span>
                  <span className="text-xs font-semibold text-white">📁 Sampul Buku</span>
                </div>
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-[10px] text-indigo-300 block font-medium">Folder Foto:</span>
                  <span className="text-xs font-semibold text-white">📁 Foto Siswa</span>
                </div>
              </div>
            </div>

            {/* Status Gambar Base64 vs Drive */}
            <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-indigo-200 block">Status Gambar di Database:</span>
                <span className="text-xs font-bold text-white">
                  {totalBase64Count === 0
                    ? ' Semua gambar sudah optimal (Menggunakan Tautan/Drive)'
                    : `⚠️ Ditemukan ${totalBase64Count} gambar lokal Base64 (${base64BooksCount} sampul, ${base64StudentsCount} foto siswa)`}
                </span>
              </div>
            </div>

            {/* Tombol Migrasi Massal */}
            {totalBase64Count > 0 && (
              <div className="space-y-2">
                <button
                  onClick={handleMigrateAllImagesToDrive}
                  disabled={isMigratingImages || !scriptUrlInput}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isMigratingImages ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        Mengunggah ({migrationProgress?.current || 0}/{migrationProgress?.total || 0})...
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Pindahkan Semua Gambar Base64 ke Google Drive Sekarang</span>
                    </>
                  )}
                </button>
                {migrationProgress && (
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round(((migrationProgress.current) / (migrationProgress.total || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card Status & Cadangan Google Sheets */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 font-heading">
                Cadangkan ke Google Sheets (Drive)
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Ekspor seluruh data katalog buku ({books.length}), data anggota ({students.length}), dan sirkulasi transaksi ({transactions.length}) langsung ke spreadsheet Google Drive.
            </p>
            <button
              onClick={handleSyncToSheets}
              disabled={isSyncingSheets || !scriptUrlInput}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
            >
              {isSyncingSheets ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Menyinkronkan ke Spreadsheet...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Cadangkan Sekarang ke Google Sheets</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Pengaturan Apps Script & Firebase */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card Konfigurasi Google Apps Script */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Konfigurasi Jembatan Google Apps Script
                </h3>
              </div>
              <button
                onClick={handleCopyCode}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Code.gs</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Web App Google Apps Script
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={scriptUrlInput}
                  onChange={(e) => setScriptUrlInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID Folder Google Drive (Opsional)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Folder className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Folder otomatis dibuat jika dikosongkan"
                      value={folderIdInput}
                      onChange={(e) => setFolderIdInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Status Hasil Tes */}
              {scriptTestResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    scriptTestResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {scriptTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{scriptTestResult.message}</span>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleTestAppsScript}
                  disabled={isTestingScript || !scriptUrlInput}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isTestingScript ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  <span>Uji Sambungan</span>
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Konfigurasi</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card Firebase Firestore Database */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  Setup Cloud Firebase Firestore
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                {firebaseStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Project ID:</span>
                <span className="font-mono font-medium text-slate-800">{firebaseInfo.projectId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Database ID:</span>
                <span className="font-mono font-medium text-slate-800 truncate block">
                  {firebaseInfo.databaseId}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Mode Sinkronisasi:</span>
                <span className="font-semibold text-emerald-700">Diferensial (Delta Sync Hemat Kuota)</span>
              </div>
              <div className="col-span-2 text-[11px] text-slate-600 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/60">
                {syncMeta.lastDeltaReport || 'Cache lokal aman dari hard refresh. Hanya perbedaan cloud yang diunduh.'}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => checkDeltaSync(false)}
                disabled={isSyncChecking}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncChecking ? 'animate-spin' : ''}`} />
                <span>Cek Perbedaan (Hemat Kuota)</span>
              </button>

              <button
                onClick={handleTestFirebase}
                disabled={testingFirebase}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                {testingFirebase ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Database className="w-3.5 h-3.5" />
                )}
                <span>Tes Koneksi</span>
              </button>

              <button
                onClick={handleSyncToFirebase}
                disabled={isSyncingFirebase}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
              >
                {isSyncingFirebase ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyinkronkan ke Firebase...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Sinkronkan Semua Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Kode Google Apps Script */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base font-heading">
                  Kode Google Apps Script (Code.gs)
                </h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                Tutup
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 space-y-1">
              <div className="font-semibold text-indigo-900">3 Langkah Mudah Penerapan:</div>
              <ol className="list-decimal list-inside space-y-0.5 text-indigo-950">
                <li>Buka <strong>script.google.com</strong> dan buat Proyek Baru.</li>
                <li>Tempel kode di bawah ke dalam file <strong>Code.gs</strong>.</li>
                <li>Klik <strong>Deploy (Terapkan)</strong> &gt; <strong>New deployment</strong> &gt; Pilih <strong>Web App</strong> (Akses: <em>Anyone</em>), lalu salin URL-nya.</li>
              </ol>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col bg-slate-900 rounded-xl p-3">
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-800">
                <span className="text-[11px] text-slate-400 font-mono">Code.gs</span>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                >
                  {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Disalin' : 'Salin Kode'}</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-200 font-mono overflow-auto flex-1 p-1 scrollbar-thin">
                {APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
