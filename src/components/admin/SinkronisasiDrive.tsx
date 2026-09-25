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
  X,
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
    syncCollectionToFirebase,
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
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [scriptTestResult, setScriptTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Synchronize inputs when appsScriptUrl / driveFolderId updates in realtime from other devices
  React.useEffect(() => {
    setScriptUrlInput(appsScriptUrl);
  }, [appsScriptUrl]);

  React.useEffect(() => {
    setFolderIdInput(driveFolderId);
  }, [driveFolderId]);

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

  // Save Script Settings to Firebase (Realtime across devices)
  const handleSaveSettings = async () => {
    if (!scriptUrlInput.trim()) {
      showToast('warning', 'URL Kosong', 'Harap masukkan URL Web App Google Apps Script');
      return;
    }
    setIsSavingSettings(true);
    try {
      const ok = await updateAppsScriptSettings(scriptUrlInput.trim(), folderIdInput.trim());
      if (ok) {
        await syncCollectionToFirebase('settings');
      }
    } finally {
      setIsSavingSettings(false);
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F7FA] text-[#1E3A5F] flex items-center justify-center border border-[#E2E8F0] shrink-0">
            <Cloud className="w-5 h-5 text-[#1E3A5F]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1A1A2E] font-heading">
              Sinkronisasi Cloud Drive & Firebase
            </h2>
            <p className="text-xs text-slate-500">
              Pengelolaan logo resmi, cadangan Google Drive via Apps Script, dan Firestore
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-[#10B981] border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            Firebase Aktif
          </span>
          <button
            type="button"
            onClick={() => setShowCodeModal(true)}
            className="min-h-[44px] px-3.5 py-2 bg-[#F5F7FA] hover:bg-[#E2E8F0] text-[#1E3A5F] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#E2E8F0] cursor-pointer"
            title="Lihat dan salin kode Google Apps Script"
          >
            <Code className="w-4 h-4" />
            <span>Kode Script</span>
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="min-h-[44px] px-4 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] disabled:bg-[#E2E8F0] disabled:text-slate-400 text-[#1A1A2E] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer select-none"
            title="Simpan pengaturan Apps Script ke Firebase"
          >
            {isSavingSettings ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            <span>Simpan ke Firebase</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Pengaturan Logo Sekolah (Khusus Super Admin) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#1E3A5F]" />
                <h3 className="text-sm font-bold text-[#1A1A2E] font-heading">
                  Logo Perpustakaan & Sekolah
                </h3>
              </div>
              {isSuperAdmin ? (
                <span className="px-2 py-0.5 bg-[#F5F7FA] text-[#1E3A5F] text-[10px] font-bold rounded-md border border-[#E2E8F0]">
                  Super Admin
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-md border border-amber-200 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Hanya Super Admin
                </span>
              )}
            </div>

            {/* Logo Saat Ini */}
            <div className="flex items-center gap-4 p-3 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
              <div className="w-16 h-16 rounded-xl bg-white border border-[#E2E8F0] p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-[#1E3A5F] text-white flex items-center justify-center font-bold text-xs rounded-lg">
                    SMP 1
                  </div>
                )}
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-xs font-semibold text-[#1A1A2E] truncate">
                  {logoUrl ? 'Logo Kustom Tersimpan' : 'Logo Default Sistem (Bunga Tanjung)'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {logoUrl ? logoUrl : 'SMP Negeri 1 Bengkalis'}
                </div>
                {isSuperAdmin && logoUrl && (
                  <button
                    type="button"
                    onClick={() => updateLogo('')}
                    className="text-[11px] text-[#EF4444] hover:underline font-medium cursor-pointer"
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
                  <label className="block text-xs font-semibold text-[#1A1A2E]">
                    Unggah Berkas Logo Baru
                  </label>
                  <label className="border-2 border-dashed border-[#E2E8F0] hover:border-[#1E3A5F] rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#F5F7FA] hover:bg-slate-100 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-[#1A1A2E]">
                      {selectedFile ? selectedFile.name : 'Pilih Berkas Logo'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG, SVG atau WEBP (Maks. 5 MB)
                    </span>
                  </label>
                </div>

                {/* Pratinjau Berkas Terpilih */}
                {previewImage && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-10 h-10 object-contain rounded-lg bg-white border border-[#E2E8F0] p-0.5"
                      />
                      <div className="text-xs">
                        <div className="font-semibold text-[#1A1A2E] truncate max-w-[180px]">
                          {selectedFile?.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Siap diunggah
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleUploadLogoToDrive}
                      disabled={isUploadingLogo}
                      className="min-h-[44px] px-3.5 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
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
                <div className="pt-2 border-t border-[#E2E8F0] space-y-2">
                  <label className="block text-xs font-semibold text-[#1A1A2E]">
                    Atau Masukkan Tautan Logo Langsung (URL)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="cth: https://domain.sch.id/logo.png"
                      value={directUrlInput}
                      onChange={(e) => setDirectUrlInput(e.target.value)}
                      className="flex-1 min-h-[44px] px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] text-[#1A1A2E]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveDirectUrl}
                      disabled={!directUrlInput.trim()}
                      className="min-h-[44px] px-4 py-2 bg-[#1E3A5F] hover:bg-[#162C47] text-white rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#F5F7FA] text-slate-500 rounded-xl text-xs text-center">
                Perubahan logo perpustakaan memerlukan wewenang Super Admin.
              </div>
            )}
          </div>

          {/* Card Penyimpanan Gambar Google Drive & Migrasi Massal */}
          <div className="bg-[#1E3A5F] rounded-xl p-5 text-white shadow-md space-y-4 border border-[#142842]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <HardDrive className="w-4 h-4 text-[#F5A623]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-heading">
                    Penyimpanan Gambar Google Drive
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Otomatis simpan sampul buku & foto siswa ke Google Drive
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-[#F5A623] text-[#1A1A2E] text-[10px] font-bold rounded-md">
                Drive Cloud
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white/10 rounded-lg border border-white/10">
                <span className="text-[10px] text-slate-300 block font-medium">Folder Sampul:</span>
                <span className="text-xs font-semibold text-white">📁 Sampul Buku</span>
              </div>
              <div className="p-2.5 bg-white/10 rounded-lg border border-white/10">
                <span className="text-[10px] text-slate-300 block font-medium">Folder Foto:</span>
                <span className="text-xs font-semibold text-white">📁 Foto Siswa</span>
              </div>
            </div>

            {/* Status Gambar Base64 vs Drive */}
            <div className="bg-white/10 p-3 rounded-lg border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-300 block">Status Gambar di Database:</span>
                <span className="text-xs font-bold text-white">
                  {totalBase64Count === 0
                    ? ' Semua gambar sudah optimal (Tautan Google Drive)'
                    : `⚠️ ${totalBase64Count} gambar lokal Base64 (${base64BooksCount} sampul, ${base64StudentsCount} foto siswa)`}
                </span>
              </div>
            </div>

            {/* Tombol Migrasi Massal */}
            {totalBase64Count > 0 && (
              <div className="space-y-2">
                <button
                  onClick={handleMigrateAllImagesToDrive}
                  disabled={isMigratingImages || !scriptUrlInput}
                  className="w-full min-h-[44px] py-2.5 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
                      <Sparkles className="w-4 h-4 text-[#1A1A2E]" />
                      <span>Pindahkan Semua Gambar Base64 ke Google Drive</span>
                    </>
                  )}
                </button>
                {migrationProgress && (
                  <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#F5A623] h-1.5 rounded-full transition-all duration-300"
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
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-3">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-[#1A1A2E] font-heading">
                Cadangkan ke Google Sheets (Drive)
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Ekspor seluruh data katalog buku ({books.length}), data anggota ({students.length}), dan sirkulasi transaksi ({transactions.length}) langsung ke spreadsheet Google Drive.
            </p>
            <button
              onClick={handleSyncToSheets}
              disabled={isSyncingSheets || !scriptUrlInput}
              className="w-full min-h-[44px] py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#1E3A5F]" />
                <h3 className="text-sm font-bold text-[#1A1A2E] font-heading">
                  Konfigurasi Jembatan Google Apps Script
                </h3>
              </div>
              <button
                onClick={handleCopyCode}
                className="text-xs text-[#1E3A5F] hover:text-[#162C47] font-semibold flex items-center gap-1 cursor-pointer"
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
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">
                  URL Web App Google Apps Script
                </label>
                <input
                  type="url"
                  placeholder="cth: https://script.google.com/macros/s/.../exec"
                  value={scriptUrlInput}
                  onChange={(e) => setScriptUrlInput(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] focus:outline-none focus:border-[#1E3A5F] text-[#1A1A2E] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A2E] mb-1">
                  ID Folder Google Drive (Opsional)
                </label>
                <div className="relative">
                  <Folder className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="cth: 1a2B3c4D5e... (otomatis jika dikosongkan)"
                    value={folderIdInput}
                    onChange={(e) => setFolderIdInput(e.target.value)}
                    className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] focus:outline-none focus:border-[#1E3A5F] text-[#1A1A2E] font-mono"
                  />
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
                  className="min-h-[44px] px-4 py-2 bg-[#F5F7FA] hover:bg-slate-200 active:bg-slate-300 text-[#1A1A2E] border border-[#E2E8F0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isTestingScript ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>Uji Sambungan</span>
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="min-h-[44px] px-4 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  title="Simpan konfigurasi ke Cloud Firestore"
                >
                  {isSavingSettings ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan ke Firebase</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card Firebase Firestore Database */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#1E3A5F]" />
                <h3 className="text-sm font-bold text-[#1A1A2E] font-heading">
                  Setup Cloud Firebase Firestore
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                {firebaseStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#F5F7FA] p-3 rounded-xl border border-[#E2E8F0]">
              <div>
                <span className="text-slate-400 block text-[10px]">Project ID:</span>
                <span className="font-mono font-medium text-[#1A1A2E]">{firebaseInfo.projectId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Database ID:</span>
                <span className="font-mono font-medium text-[#1A1A2E] truncate block">
                  {firebaseInfo.databaseId}
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Mode Sinkronisasi:</span>
                <span className="font-semibold text-emerald-700">Diferensial (Delta Sync)</span>
              </div>
              <div className="col-span-2 text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-[#E2E8F0]">
                {syncMeta.lastDeltaReport || 'Cache lokal aman. Hanya perubahan data yang diunduh dari cloud.'}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => checkDeltaSync(false)}
                disabled={isSyncChecking}
                className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#F5F7FA] active:bg-slate-100 text-[#1E3A5F] border border-[#E2E8F0] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncChecking ? 'animate-spin' : ''}`} />
                <span>Cek Perbedaan</span>
              </button>

              <button
                onClick={handleTestFirebase}
                disabled={testingFirebase}
                className="min-h-[44px] px-3.5 py-2 bg-[#F5F7FA] hover:bg-slate-200 active:bg-slate-300 text-[#1A1A2E] border border-[#E2E8F0] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {testingFirebase ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Database className="w-3.5 h-3.5 text-slate-600" />
                )}
                <span>Tes Koneksi</span>
              </button>

              <button
                onClick={handleSyncToFirebase}
                disabled={isSyncingFirebase}
                className="min-h-[44px] flex-1 py-2 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isSyncingFirebase ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyinkronkan...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 text-[#F5A623]" />
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
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-[#1E3A5F]" />
                <h3 className="font-bold text-[#1A1A2E] text-base font-heading">
                  Kode Google Apps Script (Code.gs)
                </h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-[#F5F7FA] p-3 rounded-lg border border-[#E2E8F0] space-y-1">
              <div className="font-semibold text-[#1A1A2E]">Langkah Penerapan:</div>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-600">
                <li>Buka <strong>script.google.com</strong> &gt; buat Proyek Baru.</li>
                <li>Tempel kode di bawah ke dalam file <strong>Code.gs</strong>.</li>
                <li>Pilih <strong>Deploy</strong> &gt; <strong>New deployment</strong> &gt; <strong>Web App</strong> (Akses: <em>Anyone</em>), lalu salin URL-nya.</li>
              </ol>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col bg-[#0F1F33] rounded-xl p-3 border border-[#1E3A5F]">
              <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-700">
                <span className="text-[11px] text-slate-400 font-mono">Code.gs</span>
                <button
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
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
