import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { SMPN1Logo } from '../common/SMPN1Logo';
import { WELCOME_THEMES, getWelcomeTheme } from '../../utils/welcomeTheme';
import {
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Palette,
  ExternalLink,
  BookOpen,
  Info,
  Type,
  Quote,
  ShieldAlert,
  Check,
} from 'lucide-react';

export const PengaturanHalamanUtama: React.FC = () => {
  const {
    welcomeTitle,
    welcomeSubtitle,
    welcomeQuote,
    welcomeMotto,
    welcomeCopyright,
    welcomeButtonText,
    welcomeBgTheme,
    welcomeBgColor,
    logoUrl,
    updateWelcomeSettings,
    updateLogo,
    appsScriptUrl,
    showToast,
  } = useLibrary();

  // Local draft states for editing
  const [draftTitle, setDraftTitle] = useState(welcomeTitle);
  const [draftSubtitle, setDraftSubtitle] = useState(welcomeSubtitle);
  const [draftQuote, setDraftQuote] = useState(welcomeQuote);
  const [draftMotto, setDraftMotto] = useState(welcomeMotto);
  const [draftCopyright, setDraftCopyright] = useState(welcomeCopyright);
  const [draftButtonText, setDraftButtonText] = useState(welcomeButtonText);
  const [draftBgTheme, setDraftBgTheme] = useState(welcomeBgTheme || 'sky');
  const [draftBgColor, setDraftBgColor] = useState(welcomeBgColor || '#0284c7');
  const [draftLogoUrl, setDraftLogoUrl] = useState(logoUrl);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sampleStudentName, setSampleStudentName] = useState('Muslim');
  const [sampleClass, setSampleClass] = useState('Kelas 8F');

  // Preview theme helper
  const previewTheme = getWelcomeTheme(draftBgTheme, draftBgColor);

  // Handle Save
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    await updateWelcomeSettings({
      welcomeTitle: draftTitle,
      welcomeSubtitle: draftSubtitle,
      welcomeQuote: draftQuote,
      welcomeMotto: draftMotto,
      welcomeCopyright: draftCopyright,
      welcomeButtonText: draftButtonText,
      welcomeBgTheme: draftBgTheme,
      welcomeBgColor: draftBgColor,
      logoUrl: draftLogoUrl,
    });
    setIsSaving(false);
  };

  // Reset to screenshot defaults
  const handleResetDefaults = () => {
    const defaultTitle = 'Selamat Datang';
    const defaultSubtitle = 'di Perpustakaan Bunga Tanjung\nSMPN 1 Bengkalis';
    const defaultQuote = '“Ke sekolah bukan hanya mempelajari buku, tetapi belajar tentang Disiplin, Tanggung Jawab, dan Saling Menghargai”';
    const defaultMotto = 'JUJUR ITU BUTUH USAHA';
    const defaultCopyright = 'Copyright SMPN 1 BENGKALIS';
    const defaultButton = 'MASUK';

    setDraftTitle(defaultTitle);
    setDraftSubtitle(defaultSubtitle);
    setDraftQuote(defaultQuote);
    setDraftMotto(defaultMotto);
    setDraftCopyright(defaultCopyright);
    setDraftButtonText(defaultButton);
    setDraftBgTheme('sky');
    setDraftBgColor('#0284c7');
    setDraftLogoUrl('');

    showToast('info', 'Form Direset', 'Nilai dikembalikan ke format standar Biru Langit');
  };

  // Upload Logo via Apps Script to Drive
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!appsScriptUrl) {
      // Local preview if apps script not yet linked
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64 = loadEvent.target?.result as string;
        setDraftLogoUrl(base64);
        showToast('info', 'Pratinjau Logo Aktif', 'Tersimpan sementara di pratinjau (hubungkan Google Drive untuk penyimpanan cloud)');
      };
      reader.readAsDataURL(file);
      return;
    }

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const response = await fetch(appsScriptUrl, {
            method: 'POST',
            body: JSON.stringify({
              action: 'uploadLogo',
              fileName: `logo_perpustakaan_${Date.now()}.${file.name.split('.').pop() || 'png'}`,
              mimeType: file.type,
              base64Data: base64Data,
            }),
          });
          const result = await response.json();
          if (result.success && result.fileUrl) {
            setDraftLogoUrl(result.fileUrl);
            await updateLogo(result.fileUrl);
            showToast('success', 'Logo Terunggah ke Drive', 'Logo berhasil disimpan di Google Drive');
          } else {
            throw new Error(result.error || 'Respon Apps Script tidak valid');
          }
        } catch (err: any) {
          console.warn('Upload cloud error:', err);
          const base64 = reader.result as string;
          setDraftLogoUrl(base64);
          showToast('warning', 'Pratinjau Lokal', 'Gagal kirim ke Drive, menggunakan berkas lokal');
        } finally {
          setIsUploading(false);
        }
      };
    } catch {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Palette className="w-4 h-4" />
            <span>Kustomisasi Tampilan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Pengaturan Tampilan Halaman Utama
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atur warna latar belakang login (Biru Langit), logo, ucapan selamat datang, kutipan mutiara, motto, tombol, dan hak cipta.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Format Standar</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-sky-600/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Live Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Background Color & Theme Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-600" />
              <span>Warna & Tema Latar Belakang Login</span>
            </h3>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Pilih Palet Warna Latar Beranda
              </label>

              {/* Theme Preset Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.values(WELCOME_THEMES).map((thm) => {
                  const isSelected = draftBgTheme === thm.id;
                  return (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => {
                        setDraftBgTheme(thm.id);
                        setDraftBgColor(thm.hex);
                      }}
                      className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 shadow-xs'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-full border border-white shadow-xs shrink-0"
                            style={{ backgroundColor: thm.hex }}
                          />
                          <span className="text-xs font-bold text-slate-800 leading-tight">
                            {thm.name}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="h-2 w-full rounded-full overflow-hidden bg-slate-200">
                        <div
                          className="h-full w-full"
                          style={{ backgroundColor: thm.hex }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Color Selector */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <input
                      type="color"
                      value={draftBgColor}
                      onChange={(e) => {
                        setDraftBgColor(e.target.value);
                        setDraftBgTheme('custom');
                      }}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0 bg-transparent overflow-hidden"
                      title="Pilih warna kustom"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Warna Kustom Hex
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Atur kode warna hex khusus
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">HEX:</span>
                  <input
                    type="text"
                    value={draftBgColor}
                    onChange={(e) => {
                      setDraftBgColor(e.target.value);
                      setDraftBgTheme('custom');
                    }}
                    placeholder="#0284c7"
                    className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Text and Content */}
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Type className="w-4 h-4 text-sky-600" />
              <span>Teks & Ucapan Selamat Datang</span>
            </h3>

            {/* Logo Settings */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Logo Perpustakaan / Sekolah
              </label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-16 rounded-xl bg-slate-900 border border-sky-500/20 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
                  <SMPN1Logo customUrl={draftLogoUrl} className="w-full h-full" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Mengunggah...' : 'Unggah Logo Baru'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>

                    {draftLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setDraftLogoUrl('')}
                        className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 text-xs font-medium hover:bg-rose-50 transition-colors"
                      >
                        Gunakan Lambang Standar SMPN 1
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={draftLogoUrl}
                    onChange={(e) => setDraftLogoUrl(e.target.value)}
                    placeholder="Atau tempel URL gambar logo langsung..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Field 1: Judul Selamat Datang */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Utama
              </label>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Contoh: Selamat Datang"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                required
              />
            </div>

            {/* Field 2: Subjudul / Nama Perpustakaan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subjudul / Instansi (Bisa Multi-baris)
              </label>
              <textarea
                rows={2}
                value={draftSubtitle}
                onChange={(e) => setDraftSubtitle(e.target.value)}
                placeholder="Contoh: di Perpustakaan Bunga Tanjung&#10;SMPN 1 Bengkalis"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-sans"
                required
              />
              <span className="text-[11px] text-slate-400">Gunakan Enter jika ingin membagi menjadi 2 baris (seperti di gambar).</span>
            </div>

            {/* Field 3: Kutipan Mutiara / Quote */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-slate-400" />
                <span>Kutipan / Pesan Motivasi (Tercetak Miring)</span>
              </label>
              <textarea
                rows={3}
                value={draftQuote}
                onChange={(e) => setDraftQuote(e.target.value)}
                placeholder="Contoh: “Ke sekolah bukan hanya mempelajari buku, tetapi belajar tentang Disiplin, Tanggung Jawab, dan Saling Menghargai”"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            {/* Field 4: Teks Tombol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teks Tombol Masuk
                </label>
                <input
                  type="text"
                  value={draftButtonText}
                  onChange={(e) => setDraftButtonText(e.target.value)}
                  placeholder="Contoh: MASUK"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  required
                />
              </div>

              {/* Field 5: Slogan / Motto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motto / Slogan Sekolah (🌱)
                </label>
                <input
                  type="text"
                  value={draftMotto}
                  onChange={(e) => setDraftMotto(e.target.value)}
                  placeholder="Contoh: JUJUR ITU BUTUH USAHA"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 uppercase"
                />
              </div>
            </div>

            {/* Field 6: Hak Cipta / Copyright */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Teks Hak Cipta / Copyright
              </label>
              <input
                type="text"
                value={draftCopyright}
                onChange={(e) => setDraftCopyright(e.target.value)}
                placeholder="Contoh: Copyright SMPN 1 BENGKALIS"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan ke Sistem & Firebase'}</span>
              </button>
            </div>
          </form>

          {/* Quick info tips */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-800 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-sky-900">
              <Info className="w-4 h-4 text-sky-700" />
              <span>Sinkronisasi Otomatis</span>
            </div>
            <p className="leading-relaxed">
              Semua teks, warna latar (Biru Langit), dan logo yang Anda simpan di sini akan langsung tampil di halaman depan beranda dan tersimpan permanen di Firebase Cloud Firestore serta peramban lokal.
            </p>
          </div>
        </div>

        {/* Right Preview: 5 cols (Simulating Smartphone Device with Screenshot layout) */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="bg-slate-900 rounded-3xl p-3 border-4 border-slate-800 shadow-2xl max-w-[380px] mx-auto">
            {/* Phone Screen Top Notch */}
            <div className="flex items-center justify-between px-3 py-1.5 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                <span>Live Preview Beranda</span>
              </div>
              <span>100% Sesuai</span>
            </div>

            {/* Inner Phone Screen Layout mimicking the actual login screen */}
            <div className={`w-full ${previewTheme.bgClass} rounded-2xl p-5 border text-center relative overflow-hidden flex flex-col items-center transition-colors duration-300`}>
              {/* Radial Top Glow */}
              <div className={`w-32 h-32 ${previewTheme.topGlowClass} rounded-full blur-xl absolute -top-4 pointer-events-none`} />

              {/* Logo */}
              <div className="relative mb-2 mt-1">
                <SMPN1Logo
                  customUrl={draftLogoUrl}
                  className="w-16 h-20 drop-shadow-[0_4px_14px_rgba(2,132,199,0.35)]"
                />
              </div>

              {/* Heading */}
              <h4 className="text-xl font-extrabold text-white tracking-tight leading-snug font-serif">
                {draftTitle || 'Selamat Datang'}
              </h4>

              {/* Subheading */}
              <div className={`text-sm font-bold ${previewTheme.subtitleClass} tracking-normal leading-snug font-serif whitespace-pre-line mt-0.5`}>
                {draftSubtitle || 'di Perpustakaan Bunga Tanjung\nSMPN 1 Bengkalis'}
              </div>

              {/* Quote */}
              {draftQuote && (
                <p className={`italic ${previewTheme.quoteClass} text-[11px] font-serif leading-relaxed px-1 my-3`}>
                  {draftQuote}
                </p>
              )}

              {/* Input Form Fields (Less rounded: rounded-lg) */}
              <div className="w-full space-y-2.5 my-1">
                <div className={`${previewTheme.inputClass} text-slate-900 font-bold text-center text-xs sm:text-sm rounded-lg py-2.5 px-3.5 shadow-inner border`}>
                  {sampleStudentName}
                </div>

                <div className={`${previewTheme.inputClass} text-slate-900 font-bold text-center text-xs sm:text-sm rounded-lg py-2.5 px-3.5 shadow-inner border`}>
                  {sampleClass}
                </div>

                {/* Submit Button (rounded-lg) */}
                <div className={`w-full py-2.5 px-4 rounded-lg ${previewTheme.submitBtnClass} text-white font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center shadow-sm`}>
                  {draftButtonText || 'MASUK'}
                </div>
              </div>

              {/* Footer Motto */}
              {draftMotto && (
                <div className={`${previewTheme.mottoClass} text-[10px] font-black tracking-widest uppercase mt-4 flex items-center justify-center gap-1`}>
                  <span>🌱</span>
                  <span>{draftMotto}</span>
                  <span>🌱</span>
                </div>
              )}

              {/* Copyright */}
              {draftCopyright && (
                <div className={`${previewTheme.copyrightClass} text-[9px] font-semibold tracking-wider uppercase mt-1`}>
                  {draftCopyright}
                </div>
              )}
            </div>

            <div className="text-center mt-2 text-[10px] text-slate-400">
              Pratinjau responsif tema & sudut tombol
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

