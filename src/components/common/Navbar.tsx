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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Name */}
          <div
            onClick={() => onRouteChange('beranda')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-emerald-500/20 flex items-center justify-center p-1 shadow-sm shrink-0">
              <SMPN1Logo customUrl={logoUrl} className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg font-heading group-hover:text-emerald-700 transition-colors">
                  Bunga Tanjung
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">
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
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => onRouteChange('beranda')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  currentRoute === 'beranda'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Beranda</span>
              </button>
              <button
                onClick={() => onRouteChange('umum')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  currentRoute === 'umum'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>
                  <span className="hidden sm:inline">Portal </span>Siswa
                </span>
              </button>
              <button
                onClick={() => onRouteChange('admin')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  currentRoute === 'admin'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  <span className="hidden sm:inline">Panel </span>Admin
                </span>
              </button>
            </div>

            {/* Current user pill */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden md:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
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
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
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
