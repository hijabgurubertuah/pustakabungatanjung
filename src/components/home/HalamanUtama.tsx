import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { SMPN1Logo } from '../common/SMPN1Logo';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { PWAInstallButton } from '../common/PWAInstallButton';
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
      {/* Top Floating PWA Install Badge */}
      <div className="absolute top-4 right-4 z-20">
        <PWAInstallButton />
      </div>

      {/* Top Ambient Glow Light */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 ${theme.topGlowClass} rounded-full blur-3xl pointer-events-none`} />

      {/* ========================================================================= */}
      {/* MAIN UNIFIED AUTHENTICATION CARD CONTAINER (rounded-xl max)               */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`w-full max-w-[420px] ${theme.cardClass} rounded-xl p-6 sm:p-8 relative flex flex-col items-center text-center my-auto z-10 backdrop-blur-xs border border-white/10`}
      >
        {/* Soft Radial Ambient Behind Logo */}
        <div className={`w-36 h-36 ${theme.topGlowClass} rounded-full blur-xl absolute top-6 pointer-events-none`} />

        {/* 1. School Emblem / Logo */}
        <div className="relative mb-3 flex items-center justify-center">
          <SMPN1Logo
            customUrl={logoUrl}
            className="w-20 h-24 sm:w-22 sm:h-26 drop-shadow-[0_4px_16px_rgba(245,166,35,0.3)]"
          />
        </div>

        {/* 2. Welcome Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug font-heading">
          {welcomeTitle || 'Selamat Datang'}
        </h1>

        {/* 3. Welcome Subtitle */}
        <div className={`text-sm sm:text-base font-medium ${theme.subtitleClass} tracking-normal leading-normal whitespace-pre-line mt-1`}>
          {welcomeSubtitle || 'di Perpustakaan Bunga Tanjung\nSMPN 1 Bengkalis'}
        </div>

        {/* 4. Inspirational Quote */}
        {welcomeQuote && (
          <p className={`italic ${theme.quoteClass} text-xs font-normal leading-relaxed px-2 my-3`}>
            "{welcomeQuote}"
          </p>
        )}

        {/* ======================================================================= */}
        {/* UNIFIED LOGIN FORM (rounded-xl max, 44px min touch targets)             */}
        {/* ======================================================================= */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="w-full space-y-3 mt-2"
        >
          {/* Input field for NISN, Card ID, or Admin ID */}
          <div className="w-full text-left">
            <input
              id="input-student-nisn-card"
              type="text"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setLoginError('');
              }}
              placeholder="cth: 0098765431 / BT-SMP1-001"
              className={`w-full min-h-[44px] ${theme.inputClass} placeholder:text-slate-400 font-semibold text-center text-sm rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#F5A623] border border-[#E2E8F0] transition-all`}
              autoFocus
            />
            {/* Inline validation error */}
            {loginError && (
              <div className="mt-1.5 p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="leading-tight">{loginError}</span>
              </div>
            )}
          </div>

          {/* Dedicated Scan Button (min-h-[44px], 4 visual states) */}
          <div>
            <button
              type="button"
              id="btn-open-student-scanner"
              onClick={() => {
                setIsScannerOpen(true);
                setLoginError('');
              }}
              className={`w-full min-h-[44px] px-4 rounded-xl ${theme.scanBtnClass} text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer group active:scale-[0.98] select-none`}
            >
              <ScanLine className={`w-4 h-4 ${theme.scanIconClass}`} />
              <span>Pindai Barcode / Kartu</span>
            </button>
          </div>

          {/* Vibrant MASUK Button (min-h-[44px], 4 visual states, Gold/Amber #F5A623) */}
          <button
            type="submit"
            id="btn-submit-student-login"
            disabled={isSubmitting}
            className={`w-full min-h-[44px] px-5 rounded-xl ${theme.submitBtnClass} active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed font-bold text-base tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 select-none`}
          >
            <span>{welcomeButtonText || 'MASUK'}</span>
          </button>
        </form>

        {/* 6. Footer Motto */}
        {welcomeMotto && (
          <div className={`${theme.mottoClass} text-xs font-bold tracking-wider uppercase mt-4 flex items-center justify-center gap-1.5`}>
            <span>{welcomeMotto}</span>
          </div>
        )}

        {/* 7. Copyright Note */}
        {welcomeCopyright && (
          <div className={`${theme.copyrightClass} text-[10px] font-medium tracking-wide uppercase mt-1`}>
            {welcomeCopyright}
          </div>
        )}
      </motion.div>

      {/* Discrete bottom copyright / info */}
      <div className={`text-center mt-3 text-xs ${theme.footerTextClass} z-10 flex items-center gap-2`}>
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
          placeholder="cth: 0098765431"
          onScanSuccess={handleBarcodeScanned}
        />
      )}
    </div>
  );
};

