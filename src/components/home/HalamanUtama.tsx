import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { SMPN1Logo } from '../common/SMPN1Logo';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { getWelcomeTheme } from '../../utils/welcomeTheme';
import { motion } from 'motion/react';
import {
  ScanLine,
  AlertCircle,
} from 'lucide-react';

interface HalamanUtamaProps {
  onEnterPortalSiswa?: () => void;
  onOpenAdmin?: () => void;
}

export const HalamanUtama: React.FC<HalamanUtamaProps> = ({
  onEnterPortalSiswa,
  onOpenAdmin,
}) => {
  const {
    admins,
    logoUrl,
    welcomeTitle,
    welcomeSubtitle,
    welcomeQuote,
    welcomeMotto,
    welcomeCopyright,
    welcomeButtonText,
    welcomeBgTheme,
    welcomeBgColor,
    loginSiswa,
    loginAdminByBarcode,
  } = useLibrary();

  const theme = getWelcomeTheme(welcomeBgTheme, welcomeBgColor);

  // Unified Identifier State (NISN, Card ID, or Admin NIP/ID)
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Unified Login Handler for typed input
  const handleLogin = (inputCode?: string) => {
    const code = (inputCode || identifier).trim();
    setLoginError('');

    if (!code) {
      setLoginError('Silakan masukkan NISN atau ID Kartu');
      return;
    }

    setIsSubmitting(true);
    const clean = code.toLowerCase();

    // 1. Check if matches Admin / Petugas account
    const matchingAdmin = admins.find(
      (a) =>
        a.isActive &&
        (a.id.toLowerCase() === clean ||
          a.username.toLowerCase() === clean ||
          (a.nipOrId && a.nipOrId.toLowerCase() === clean) ||
          (a.email && a.email.toLowerCase() === clean))
    );

    if (matchingAdmin) {
      const resAdmin = loginAdminByBarcode(code);
      setIsSubmitting(false);
      if (resAdmin.success) {
        if (onOpenAdmin) onOpenAdmin();
        return;
      }
    }

    // 2. Check if matches Siswa account
    const resSiswa = loginSiswa(code);
    setIsSubmitting(false);

    if (resSiswa.success) {
      if (onEnterPortalSiswa) onEnterPortalSiswa();
    } else {
      setLoginError(
        resSiswa.error || `ID / NISN "${code}" tidak ditemukan dalam sistem.`
      );
    }
  };

  // Unified Barcode Scan Handler
  const handleBarcodeScanned = (scannedCode: string) => {
    const code = scannedCode.trim();
    if (!code) {
      return { success: false, message: 'Barcode tidak terbaca' };
    }

    const clean = code.toLowerCase();

    // 1. Check if matches Admin / Petugas
    const matchingAdmin = admins.find(
      (a) =>
        a.isActive &&
        (a.id.toLowerCase() === clean ||
          a.username.toLowerCase() === clean ||
          (a.nipOrId && a.nipOrId.toLowerCase() === clean) ||
          (a.email && a.email.toLowerCase() === clean))
    );

    if (matchingAdmin) {
      const resAdmin = loginAdminByBarcode(code);
      if (resAdmin.success) {
        setIdentifier(code);
        setLoginError('');
        if (onOpenAdmin) onOpenAdmin();
        return { success: true };
      }
    }

    // 2. Check if matches Siswa
    const resSiswa = loginSiswa(code);
    if (resSiswa.success) {
      setIdentifier(code);
      setLoginError('');
      if (onEnterPortalSiswa) onEnterPortalSiswa();
      return { success: true };
    } else {
      const errMsg =
        resSiswa.error || `Kartu / Barcode "${code}" tidak terdaftar.`;
      setIdentifier(code);
      setLoginError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  return (
    <div className={`min-h-screen ${theme.bgClass} flex flex-col justify-between items-center py-6 px-4 ${theme.selectionClass} relative overflow-hidden font-sans transition-colors duration-500`}>
      {/* Top Ambient Glow Light */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 ${theme.topGlowClass} rounded-full blur-3xl pointer-events-none`} />

      {/* ========================================================================= */}
      {/* MAIN UNIFIED AUTHENTICATION CARD CONTAINER (Less rounded: rounded-2xl)     */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={`w-full max-w-[430px] ${theme.cardClass} rounded-2xl p-6 sm:p-7.5 relative flex flex-col items-center text-center my-auto z-10 backdrop-blur-xs`}
      >
        {/* Soft Radial Ambient Behind Logo */}
        <div className={`w-36 h-36 ${theme.topGlowClass} rounded-full blur-xl absolute top-6 pointer-events-none`} />

        {/* 1. School Emblem / Logo */}
        <div className="relative mb-3 flex items-center justify-center">
          <SMPN1Logo
            customUrl={logoUrl}
            className="w-20 h-24 sm:w-22 sm:h-26 drop-shadow-[0_4px_16px_rgba(2,132,199,0.35)]"
          />
        </div>

        {/* 2. Welcome Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug font-serif">
          {welcomeTitle || 'Selamat Datang'}
        </h1>

        {/* 3. Welcome Subtitle */}
        <div className={`text-base sm:text-lg font-bold ${theme.subtitleClass} tracking-normal leading-tight font-serif whitespace-pre-line mt-1`}>
          {welcomeSubtitle || 'di Perpustakaan Bunga Tanjung\nSMPN 1 Bengkalis'}
        </div>

        {/* 4. Inspirational Quote */}
        {welcomeQuote && (
          <p className={`italic ${theme.quoteClass} text-xs sm:text-sm font-serif leading-relaxed px-2 my-3 sm:my-3.5`}>
            {welcomeQuote}
          </p>
        )}

        {/* Error Notification if any */}
        {loginError && (
          <div className="w-full mb-3 p-3 rounded-lg bg-rose-950/85 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="leading-snug">{loginError}</span>
          </div>
        )}

        {/* ======================================================================= */}
        {/* UNIFIED LOGIN FORM (Less rounded: rounded-lg for input and buttons)     */}
        {/* ======================================================================= */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="w-full space-y-3 mt-1"
        >
          {/* Input field for NISN, Card ID, or Admin ID */}
          <div className="w-full">
            <input
              id="input-student-nisn-card"
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setLoginError('');
              }}
              placeholder="Masukkan NISN atau ID Kartu..."
              className={`w-full ${theme.inputClass} placeholder:text-slate-400 font-bold text-center text-sm sm:text-base rounded-lg py-3 sm:py-3.5 px-4 focus:outline-none focus:ring-2 shadow-inner transition-all`}
              autoFocus
            />
          </div>

          {/* Dedicated Scan Button (Above MASUK button with ScanLine icon) */}
          <div>
            <button
              type="button"
              id="btn-open-student-scanner"
              onClick={() => {
                setIsScannerOpen(true);
                setLoginError('');
              }}
              className={`w-full py-2.5 sm:py-3 px-4 rounded-xl ${theme.scanBtnClass} text-sm sm:text-base font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer group active:scale-[0.98]`}
            >
              <div className="p-1 rounded-md bg-white/10 group-hover:bg-white/20 border border-white/25 transition-colors shrink-0">
                <ScanLine className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${theme.scanIconClass}`} />
              </div>
              <span>Pindai Kartu / Barcode</span>
            </button>
          </div>

          {/* Vibrant MASUK Button (rounded-lg) */}
          <button
            type="submit"
            id="btn-submit-student-login"
            disabled={isSubmitting}
            className={`w-full py-3 sm:py-3.5 px-5 rounded-lg ${theme.submitBtnClass} active:scale-[0.98] font-black text-base sm:text-lg tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 uppercase`}
          >
            <span>{welcomeButtonText || 'MASUK'}</span>
          </button>
        </form>

        {/* 6. Footer Motto */}
        {welcomeMotto && (
          <div className={`${theme.mottoClass} text-xs sm:text-sm font-black tracking-widest uppercase mt-4.5 flex items-center justify-center gap-1.5`}>
            <span>🌱</span>
            <span>{welcomeMotto}</span>
            <span>🌱</span>
          </div>
        )}

        {/* 7. Copyright Note */}
        {welcomeCopyright && (
          <div className={`${theme.copyrightClass} text-[10px] sm:text-xs font-semibold tracking-wider uppercase mt-1`}>
            {welcomeCopyright}
          </div>
        )}
      </motion.div>

      {/* Discrete bottom copyright / info */}
      <div className={`text-center mt-3 text-[11px] ${theme.footerTextClass} z-10 flex items-center gap-2`}>
        <span>Sistem Perpustakaan Digital Bunga Tanjung</span>
        <span>•</span>
        <span>SMPN 1 Bengkalis</span>
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED BARCODE SCANNER MODAL                                             */}
      {/* ========================================================================= */}
      {isScannerOpen && (
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          scannerId="scanner-library-card"
          title="Pindai Kartu Anggota / Petugas"
          placeholder="Ketik NISN atau ID Kartu..."
          onScanSuccess={handleBarcodeScanned}
        />
      )}
    </div>
  );
};

