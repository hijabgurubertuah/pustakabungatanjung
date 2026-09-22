import React, { useState, useEffect } from 'react';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { ToastContainer } from './components/common/ToastContainer';
import { PortalSiswa } from './components/siswa/PortalSiswa';
import { AdminLayout } from './components/admin/AdminLayout';
import { HalamanUtama } from './components/home/HalamanUtama';
import { OfflineIndicator } from './components/common/OfflineIndicator';

const MainApp: React.FC = () => {
  const { currentUser } = useLibrary();

  // Detect URL path or default to 'beranda'
  const [currentRoute, setCurrentRoute] = useState<'beranda' | 'umum' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('admin')) return 'admin';
      if (path.includes('umum') || path.includes('siswa')) return 'umum';
    }
    return 'beranda';
  });

  // Sync route if current user logs in or logs out
  useEffect(() => {
    if (currentUser?.role === 'siswa') {
      setCurrentRoute('umum');
    } else if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') {
      setCurrentRoute('admin');
    } else if (!currentUser) {
      setCurrentRoute('beranda');
    }
  }, [currentUser]);

  const handleRouteChange = (route: 'beranda' | 'umum' | 'admin') => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState(null, '', `/${route === 'beranda' ? '' : route}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Main Viewport */}
      <div className="flex-1">
        {currentRoute === 'beranda' && (
          <HalamanUtama
            onEnterPortalSiswa={() => handleRouteChange('umum')}
            onOpenAdmin={() => handleRouteChange('admin')}
          />
        )}
        {currentRoute === 'umum' && <PortalSiswa />}
        {currentRoute === 'admin' && <AdminLayout />}
      </div>

      {/* Toast Notification Layer */}
      <ToastContainer />

      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <LibraryProvider>
      <MainApp />
    </LibraryProvider>
  );
}
