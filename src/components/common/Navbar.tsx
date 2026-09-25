import React from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BookOpen, ShieldCheck, UserCheck, LogOut, Home } from 'lucide-react';
import { SMPN1Logo } from './SMPN1Logo';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentRoute: 'beranda' | 'umum' | 'admin';
  onRouteChange: (route: 'beranda' | 'umum' | 'admin') => void;
  adminActiveTab: string;
  onAdminTabChange: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onRouteChange,
  adminActiveTab,
  onAdminTabChange,
}) => {
  const { currentUser, logout, logoUrl } = useLibrary();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Name */}
          <div
            onClick={() => onRouteChange('beranda')}
            className="flex items-center gap-3 cursor-pointer group select-none"
            role="button"
            tabIndex={0}
            aria-label="Kembali ke Beranda"
          >
            <div className="w-10 h-10 rounded-xl bg-[#1E3A5F] border border-[#F5A623]/30 flex items-center justify-center p-1 shadow-xs shrink-0">
              <SMPN1Logo customUrl={logoUrl} className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1A1A2E] tracking-tight text-base sm:text-lg font-heading group-hover:text-[#1E3A5F] transition-colors">
                  Bunga Tanjung
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-[#F5F7FA] text-[#1E3A5F] rounded-lg border border-[#E2E8F0]">
                  SMPN 1 Bengkalis
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Sistem Perpustakaan Digital</p>
            </div>
          </div>

          {/* Route Switcher & Current User Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA In-App Install Button */}
            <PWAInstallButton />

            {/* Direct Switch between /beranda, /umum & /admin */}
            <nav className="flex items-center bg-[#F5F7FA] p-1 rounded-xl border border-[#E2E8F0] gap-1" aria-label="Navigasi Utama">
              <button
                type="button"
                onClick={() => onRouteChange('beranda')}
                className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer select-none active:scale-[0.98] ${
                  currentRoute === 'beranda'
                    ? 'bg-[#1E3A5F] text-white shadow-xs'
                    : 'text-[#1A1A2E] hover:bg-white hover:text-[#1E3A5F]'
                }`}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span>Beranda</span>
              </button>
              <button
                type="button"
                onClick={() => onRouteChange('umum')}
                className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer select-none active:scale-[0.98] ${
                  currentRoute === 'umum'
                    ? 'bg-[#1E3A5F] text-white shadow-xs'
                    : 'text-[#1A1A2E] hover:bg-white hover:text-[#1E3A5F]'
                }`}
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>
                  <span className="hidden sm:inline">Portal </span>Siswa
                </span>
              </button>
              <button
                type="button"
                onClick={() => onRouteChange('admin')}
                className={`min-h-[44px] px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer select-none active:scale-[0.98] ${
                  currentRoute === 'admin'
                    ? 'bg-[#F5A623] text-[#1A1A2E] font-bold shadow-xs'
                    : 'text-[#1A1A2E] hover:bg-white hover:text-[#1E3A5F]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  <span className="hidden sm:inline">Panel </span>Admin
                </span>
              </button>
            </nav>

            {/* Current user badge */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-[#1A1A2E] leading-tight">
                    {currentUser.role === 'siswa'
                      ? currentUser.studentData?.name
                      : currentUser.adminData?.name}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">
                    {currentUser.role === 'siswa'
                      ? `Kelas ${currentUser.studentData?.classGrade}`
                      : currentUser.role}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="min-h-[44px] min-w-[44px] p-2.5 text-slate-500 hover:text-[#EF4444] hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-200 active:scale-95 flex items-center justify-center cursor-pointer"
                  title="Keluar"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
