import React from 'react';
import { WifiOff, ShieldCheck } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm flex items-center gap-3 rounded-2xl bg-slate-900/95 text-white px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-md border border-amber-500/40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
        <WifiOff className="w-4 h-4 animate-pulse" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
          <span>Mode Luring (Offline)</span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <p className="text-[11px] text-slate-300 font-normal mt-0.5 leading-tight">
          Aplikasi berjalan penuh menggunakan data cache lokal.
        </p>
      </div>
    </div>
  );
};
