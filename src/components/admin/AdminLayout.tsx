import React, { useState, useEffect, useRef } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { DashboardStats } from './DashboardStats';
import { KelolaBuku } from './KelolaBuku';
import { PinjamKembali } from './PinjamKembali';
import { KelolaKartuSiswa } from './KelolaKartuSiswa';
import { PendataanPengunjung } from './PendataanPengunjung';
import { KelolaAkunAdmin } from './KelolaAkunAdmin';
import { EksporImpor } from './EksporImpor';
import { SinkronisasiDrive } from './SinkronisasiDrive';
import { PengaturanHalamanUtama } from './PengaturanHalamanUtama';
import { DatabaseUsage } from './DatabaseUsage';
import { HalamanUtama } from '../home/HalamanUtama';
import {
  LayoutDashboard,
  Database,
  BookOpen,
  ArrowLeftRight,
  IdCard,
  UserCheck,
  ShieldAlert,
  FileSpreadsheet,
  X,
  Menu,
  ChevronRight,
  Cloud,
  Palette,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AdminLayout: React.FC = () => {
  const { currentUser, logout, logoUrl, unsyncedStatus } = useLibrary();

  // Admin active tab - Persisted across browser refresh
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) return hash;
      const saved = localStorage.getItem('bt_admin_active_tab');
      if (saved) return saved;
    }
    return 'dashboard';
  });

  // Keep localStorage and URL hash in sync with activeTab
  useEffect(() => {
    try {
      localStorage.setItem('bt_admin_active_tab', activeTab);
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    } catch {}
  }, [activeTab]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isAdmin =
    currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin');

  const getTabSyncStatus = (tabId: string): 'unsynced' | 'synced' | null => {
    if (!unsyncedStatus) return null;
    switch (tabId) {
      case 'buku':
        return unsyncedStatus.books ? 'unsynced' : 'synced';
      case 'kartu-siswa':
        return unsyncedStatus.students ? 'unsynced' : 'synced';
      case 'akun':
        return unsyncedStatus.admins ? 'unsynced' : 'synced';
      case 'pinjam-kembali':
        return unsyncedStatus.transactions ? 'unsynced' : 'synced';
      case 'pengunjung':
        return unsyncedStatus.visits ? 'unsynced' : 'synced';
      case 'halaman-utama':
        return unsyncedStatus.settings ? 'unsynced' : 'synced';
      case 'sinkronisasi':
        return (
          unsyncedStatus.settings ||
          unsyncedStatus.books ||
          unsyncedStatus.students ||
          unsyncedStatus.transactions ||
          unsyncedStatus.visits ||
          unsyncedStatus.admins
        )
          ? 'unsynced'
          : 'synced';
      default:
        return null;
    }
  };

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      const origTouchAction = document.body.style.touchAction;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsMobileSidebarOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
        document.body.style.touchAction = origTouchAction;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMobileSidebarOpen]);

  // If not logged in as Admin, show unified login screen
  if (!isAdmin) {
    return <HalamanUtama />;
  }

  const isSuperadmin = currentUser.role === 'superadmin';

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Statistik & Ringkasan' },
    { id: 'database', label: 'Database', icon: Database, desc: 'Grafik Kuota Firebase' },
    { id: 'buku', label: 'Arsip Buku', icon: BookOpen, desc: 'Katalog & Stok Fisik' },
    { id: 'pinjam-kembali', label: 'Pinjam / Kembali', icon: ArrowLeftRight, desc: 'Sirkulasi Cepat' },
    { id: 'kartu-siswa', label: 'Kartu Anggota', icon: IdCard, desc: 'Cetak & Kelola Siswa' },
    { id: 'pengunjung', label: 'Presensi Kunjungan', icon: UserCheck, desc: 'Buku Tamu & Peringkat' },
    { id: 'halaman-utama', label: 'Tampilan Beranda', icon: Palette, desc: 'Logo, Ucapan & Tema' },
    { id: 'sinkronisasi', label: 'Sinkronisasi & Drive', icon: Cloud, desc: 'Logo, Drive & Firebase' },
    ...(isSuperadmin ? [{ id: 'akun', label: 'Kelola Akun', icon: ShieldAlert, desc: 'Hak Akses Staf' }] : []),
    { id: 'ekspor-impor', label: 'Ekspor & Impor', icon: FileSpreadsheet, desc: 'CSV & Sinkronisasi' },
  ];

  const currentItem = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];
  const CurrentIcon = currentItem.icon;

  return (
    <div className="relative max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* ========================================================================= */}
      {/* MOBILE HAMBURGER BUTTON (Tinggi 120px x Lebar 30px di Kiri Tengah Layar HP) */}
      {/* ========================================================================= */}
      <button
        type="button"
        onClick={() => setIsMobileSidebarOpen(true)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 md:hidden bg-gradient-to-b from-indigo-600 via-indigo-700 to-indigo-800 text-white rounded-r-xl shadow-xl shadow-indigo-600/30 flex flex-col items-center justify-center cursor-pointer border-y border-r border-indigo-400/40 active:scale-95 transition-all group focus:outline-none select-none"
        style={{ height: '120px', width: '30px' }}
        aria-label="Buka Menu Pengaturan"
        title="Buka Menu Pengaturan"
      >
        {/* Visual 3 Hamburger Bars */}
        <div className="flex flex-col items-center justify-center gap-1.5 w-full">
          <span className="w-3.5 h-0.5 bg-white/95 rounded-full group-hover:w-4 transition-all" />
          <span className="w-4.5 h-0.5 bg-white rounded-full shadow-xs" />
          <span className="w-3.5 h-0.5 bg-white/95 rounded-full group-hover:w-4 transition-all" />
        </div>

        {/* Vertical Text Label */}
        <span className="text-[9px] font-black tracking-widest text-indigo-100 uppercase mt-2.5 [writing-mode:vertical-lr] rotate-180 select-none pointer-events-none">
          MENU
        </span>
      </button>

      {/* ========================================================================= */}
      {/* MOBILE SIDEBAR DRAWER & BACKDROP OVERLAY                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop: Tap outside automatically hides sidebar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden"
              style={{ touchAction: 'none' }}
              aria-hidden="true"
            />

            {/* Sidebar Drawer: Locked from background scrolling */}
            <motion.aside
              ref={sidebarRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed top-0 bottom-0 left-0 w-[290px] max-w-[85vw] bg-white z-50 md:hidden shadow-2xl border-r border-slate-200 flex flex-col overscroll-contain"
              style={{ touchAction: 'pan-y' }}
              role="dialog"
              aria-modal="true"
              aria-label="Menu Pengaturan Perpustakaan"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">
                      Bunga Tanjung
                    </h2>
                    <p className="text-[10px] text-slate-500 font-medium">Panel Pengaturan</p>
                  </div>
                </div>

                {/* Close Button (min 44px touch target) */}
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="w-10 h-10 -mr-1 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                  aria-label="Tutup Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active Admin Profile Bar */}
              <div className="px-4 py-3 bg-indigo-50/60 border-b border-indigo-100/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {currentUser?.adminData?.name.charAt(0) || 'P'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 leading-tight">
                      {currentUser?.adminData?.name || 'Petugas'}
                    </div>
                    <div className="text-[10px] text-indigo-600 font-semibold capitalize">
                      {currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin Sirkulasi'}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-white text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-200">
                  Online
                </span>
              </div>

              {/* Scrollable Navigation Menu (Overscroll contained, background does not scroll) */}
              <nav className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Daftar Menu
                </div>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const syncStatus = getTabSyncStatus(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all min-h-[46px] ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/20'
                          : 'text-slate-700 hover:bg-slate-100 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs truncate">{item.label}</div>
                          <div
                            className={`text-[10px] truncate ${
                              isActive ? 'text-indigo-100' : 'text-slate-400'
                            }`}
                          >
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {syncStatus === 'unsynced' && (
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-md flex items-center gap-1 ${
                              isActive
                                ? 'bg-amber-400 text-amber-950 shadow-2xs'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                            title="Ada perubahan lokal yang belum disinkronkan ke Firebase"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            <span>Lokal</span>
                          </span>
                        )}
                        {syncStatus === 'synced' && (
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-md flex items-center gap-1 ${
                              isActive
                                ? 'bg-emerald-400 text-emerald-950 shadow-2xs'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}
                            title="Tersinkronkan ke Cloud Firebase"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>Sinkron</span>
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-white/80" />}
                      </div>
                    </button>
                  );
                })}
              </nav>

              {/* Drawer Footer with School Name & Logout */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    logout();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 border border-rose-200 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar dari Panel Admin</span>
                </button>
                <p className="text-[10px] text-slate-400 font-medium text-center">
                  SMP Negeri 1 Bengkalis • Bunga Tanjung
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MAIN CONTAINER WITH PERSISTENT DESKTOP SIDEBAR + CONTENT AREA             */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* DESKTOP SIDEBAR NAV (Visible on md: and above) */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-4 self-start sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
          {/* Header / Brand */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-slate-900 leading-tight font-heading truncate">
                Bunga Tanjung
              </h2>
              <p className="text-[11px] text-slate-500 font-medium truncate">Panel Admin Perpustakaan</p>
            </div>
          </div>

          {/* Admin User Profile Badge */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                {currentUser?.adminData?.name.charAt(0) || 'P'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {currentUser?.adminData?.name || 'Petugas'}
                </div>
                <div className="text-[10px] text-indigo-600 font-semibold capitalize truncate">
                  {currentUser?.role === 'superadmin' ? 'Super Admin' : 'Admin Sirkulasi'}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-100/80 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200/60 shrink-0">
              Online
            </span>
          </div>

          {/* Navigation Links List */}
          <nav className="space-y-1">
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Menu Pengaturan
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const syncStatus = getTabSyncStatus(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs truncate">{item.label}</div>
                      <div
                        className={`text-[10px] truncate ${
                          isActive ? 'text-indigo-100' : 'text-slate-400'
                        }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {syncStatus === 'unsynced' && (
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-md flex items-center gap-1 ${
                          isActive
                            ? 'bg-amber-400 text-amber-950 shadow-2xs'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                        title="Ada perubahan lokal yang belum disinkronkan ke Firebase"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        <span>Lokal</span>
                      </span>
                    )}
                    {syncStatus === 'synced' && (
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-md flex items-center gap-1 ${
                          isActive
                            ? 'bg-emerald-400 text-emerald-950 shadow-2xs'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                        title="Tersinkronkan ke Cloud Firebase"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>Sinkron</span>
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-4 h-4 shrink-0 text-white/80" />}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer Logout Button */}
          <div className="pt-3 border-t border-slate-100 mt-auto space-y-2">
            <button
              type="button"
              onClick={logout}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Panel Admin</span>
            </button>
          </div>
        </aside>

        {/* MAIN TAB CONTENT AREA */}
        <main className="flex-1 min-w-0 w-full">
          {activeTab === 'dashboard' && <DashboardStats />}
          {activeTab === 'database' && <DatabaseUsage />}
          {activeTab === 'buku' && <KelolaBuku />}
          {activeTab === 'pinjam-kembali' && <PinjamKembali />}
          {activeTab === 'kartu-siswa' && <KelolaKartuSiswa />}
          {activeTab === 'pengunjung' && <PendataanPengunjung />}
          {activeTab === 'halaman-utama' && <PengaturanHalamanUtama />}
          {activeTab === 'sinkronisasi' && <SinkronisasiDrive />}
          {activeTab === 'akun' && isSuperadmin && <KelolaAkunAdmin />}
          {activeTab === 'ekspor-impor' && <EksporImpor />}
        </main>
      </div>
    </div>
  );
};
