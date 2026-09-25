import React, { useState } from 'react';
import { Download, Share, X, Smartphone, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If running as standalone installed app, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer border border-indigo-500/30"
        title="Pasang Aplikasi Perpustakaan di Perangkat Anda"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install Aplikasi</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported on iOS Safari)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer border border-slate-700/50"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-[#E2E8F0] animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#1E3A5F]" />
                  <h3 className="text-sm font-bold text-[#1A1A2E]">Install di iPhone / iPad</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-[#F5F7FA]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-[#1A1A2E] leading-relaxed">
                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0] flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                  <p>
                    Tekan tombol <strong>Bagikan (Share)</strong> <Share className="w-3.5 h-3.5 inline text-[#1E3A5F] mx-0.5" /> di menu bawah browser Safari Anda.
                  </p>
                </div>

                <div className="p-3 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0] flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                  <p>
                    Gulir ke bawah lalu pilih opsi <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.
                  </p>
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-emerald-800">
                    Aplikasi Perpustakaan Bunga Tanjung siap dibuka secara offline dari layar utama iPhone Anda!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white transition cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
