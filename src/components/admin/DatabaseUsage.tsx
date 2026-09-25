import React from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  HardDrive,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';

export const DatabaseUsage: React.FC = () => {
  const {
    firebaseUsageStats,
    refreshUsageStats,
    checkDeltaSync,
    isSyncChecking,
  } = useLibrary();

  const handleRefresh = async () => {
    await checkDeltaSync();
    refreshUsageStats();
  };

  // Bright & luminous Pie chart pairs with varied distinct colors (no dark/plain gray)
  const storagePieData = [
    {
      name: 'Terpakai',
      value: Math.max(0.1, firebaseUsageStats.storageBytes / (1024 * 1024)),
      color: '#10B981', // Bright Emerald
    },
    {
      name: 'Sisa Kuota',
      value: Math.max(0, 1024 - firebaseUsageStats.storageBytes / (1024 * 1024)),
      color: '#6EE7B7', // Luminous Mint Green
    },
  ];

  const readsPieData = [
    {
      name: 'Terpakai',
      value: Math.max(1, firebaseUsageStats.readsUsed),
      color: '#3B82F6', // Electric Vivid Blue
    },
    {
      name: 'Sisa Kuota',
      value: Math.max(0, firebaseUsageStats.readsMax - firebaseUsageStats.readsUsed),
      color: '#93C5FD', // Bright Sky Blue
    },
  ];

  const writesPieData = [
    {
      name: 'Terpakai',
      value: Math.max(1, firebaseUsageStats.writesUsed),
      color: '#8B5CF6', // Vivid Purple
    },
    {
      name: 'Sisa Kuota',
      value: Math.max(0, firebaseUsageStats.writesMax - firebaseUsageStats.writesUsed),
      color: '#C4B5FD', // Bright Lavender
    },
  ];

  const deletesPieData = [
    {
      name: 'Terpakai',
      value: Math.max(0.01, firebaseUsageStats.deletesUsed),
      color: '#F43F5E', // Vivid Rose Coral
    },
    {
      name: 'Sisa Kuota',
      value: Math.max(0, firebaseUsageStats.deletesMax - firebaseUsageStats.deletesUsed),
      color: '#FDA4AF', // Bright Pastel Rose
    },
  ];

  // Collection breakdown pie data
  const collectionPieData = firebaseUsageStats.collectionBreakdown.map((item) => ({
    name: item.name,
    value: Math.max(1, item.sizeBytes),
    count: item.count,
    formatted: item.sizeFormatted,
    color: item.color,
  }));

  return (
    <div className="space-y-4">
      {/* Compact Action Bar - Only Sync Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isSyncChecking}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 select-none"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncChecking ? 'animate-spin' : ''}`} />
          <span>{isSyncChecking ? 'Menyinkronkan...' : 'Sinkronkan Database'}</span>
        </button>
      </div>

      {/* 4 Primary Quota Gauge Cards (Compact & Varied Colors) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Storage Capacity Card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HardDrive className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Kapasitas Penyimpanan</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
              1 GB
            </span>
          </div>

          {/* Compact Donut Chart with Thin Borders */}
          <div className="relative h-28 my-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={storagePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={26}
                  outerRadius={52}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={1}
                >
                  {storagePieData.map((entry, index) => (
                    <Cell key={`storage-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'Terpakai' ? firebaseUsageStats.storageFormatted : '1.00 GB',
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-extrabold text-emerald-700 font-heading leading-tight">
                {firebaseUsageStats.storagePercentage}%
              </span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase">
                Terpakai
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Ukuran: <strong className="text-slate-800">{firebaseUsageStats.storageFormatted}</strong></span>
            <span className="text-emerald-700 font-semibold font-mono">1.024 MB</span>
          </div>
        </motion.div>

        {/* 2. Daily Read Quota Card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.03 }}
          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Jatah Baca Harian</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
              50 rb/hari
            </span>
          </div>

          {/* Compact Donut Chart with Thin Borders */}
          <div className="relative h-28 my-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={readsPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={26}
                  outerRadius={52}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={1}
                >
                  {readsPieData.map((entry, index) => (
                    <Cell key={`reads-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'Terpakai'
                      ? `${firebaseUsageStats.readsUsed} Baca`
                      : `${firebaseUsageStats.readsRemaining.toLocaleString('id-ID')} Baca`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-extrabold text-blue-700 font-heading leading-tight">
                {firebaseUsageStats.readsUsed}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase">
                Baca
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Sisa: <strong className="text-blue-600">{firebaseUsageStats.readsRemaining.toLocaleString('id-ID')}</strong></span>
            <span className="text-slate-500">Maks 50.000</span>
          </div>
        </motion.div>

        {/* 3. Daily Write Quota Card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.06 }}
          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                <Edit3 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Jatah Tulis Harian</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
              20 rb/hari
            </span>
          </div>

          {/* Compact Donut Chart with Thin Borders */}
          <div className="relative h-28 my-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={writesPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={26}
                  outerRadius={52}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={1}
                >
                  {writesPieData.map((entry, index) => (
                    <Cell key={`writes-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'Terpakai'
                      ? `${firebaseUsageStats.writesUsed} Tulis`
                      : `${firebaseUsageStats.writesRemaining.toLocaleString('id-ID')} Tulis`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-extrabold text-purple-700 font-heading leading-tight">
                {firebaseUsageStats.writesUsed}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase">
                Tulis
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Sisa: <strong className="text-purple-600">{firebaseUsageStats.writesRemaining.toLocaleString('id-ID')}</strong></span>
            <span className="text-slate-500">Maks 20.000</span>
          </div>
        </motion.div>

        {/* 4. Daily Delete Quota Card */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.09 }}
          className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Jatah Hapus Harian</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
              20 rb/hari
            </span>
          </div>

          {/* Compact Donut Chart with Thin Borders */}
          <div className="relative h-28 my-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deletesPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={26}
                  outerRadius={52}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={1}
                >
                  {deletesPieData.map((entry, index) => (
                    <Cell key={`deletes-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'Terpakai'
                      ? `${firebaseUsageStats.deletesUsed} Hapus`
                      : `${firebaseUsageStats.deletesRemaining.toLocaleString('id-ID')} Hapus`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-extrabold text-rose-700 font-heading leading-tight">
                {firebaseUsageStats.deletesUsed}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase">
                Hapus
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Sisa: <strong className="text-rose-600">{firebaseUsageStats.deletesRemaining.toLocaleString('id-ID')}</strong></span>
            <span className="text-slate-500">Maks 20.000</span>
          </div>
        </motion.div>
      </div>

      {/* Row 2: Compact Collection Breakdown & Quota Protection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left 7 cols: Compact Pie Chart of Database Collections */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 font-heading">
                Komposisi Koleksi Dokumen Database
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              Total {firebaseUsageStats.totalDocuments} Dokumen
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Compact Donut with Thin Borders */}
            <div className="sm:col-span-5 relative h-36 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={collectionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={66}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={1}
                  >
                    {collectionPieData.map((entry, index) => (
                      <Cell key={`coll-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${item.payload.formatted} (${item.payload.count} data)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-base font-extrabold text-slate-900 font-heading leading-tight">
                  {firebaseUsageStats.totalDocuments}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase">
                  Dokumen
                </span>
              </div>
            </div>

            {/* Compact Collection Slices Legend */}
            <div className="sm:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {firebaseUsageStats.collectionBreakdown.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-slate-700 truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-1 ml-1">
                    <span className="font-bold text-slate-800 font-mono">
                      {item.sizeFormatted}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 cols: Compact Efisiensi & Info Card */}
        <div className="lg:col-span-5 space-y-3">
          {/* Smart Delta Quota Protection Summary */}
          <div className="bg-[#1E3A5F] text-white rounded-xl p-3.5 shadow-xs border border-[#142842] space-y-2.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#F5A623]" />
                <h3 className="text-xs font-bold text-white font-heading">
                  Efisiensi & Kuota Cloud
                </h3>
              </div>
              <span className="text-[10px] font-medium text-blue-200">
                Cache Aktif
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                <span className="text-[10px] text-blue-200 block">
                  Baca Terhemat:
                </span>
                <span className="text-sm font-extrabold text-[#F5A623] font-mono">
                  +{firebaseUsageStats.savedReadsCount.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                <span className="text-[10px] text-blue-200 block">
                  Rata-rata Dokumen:
                </span>
                <span className="text-sm font-extrabold text-[#10B981] font-mono">
                  {firebaseUsageStats.avgDocumentSizeBytes} B
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-blue-200 border-t border-white/10">
              <span>Penyimpanan Foto:</span>
              <span className="font-semibold text-[#10B981] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Google Drive
              </span>
            </div>
          </div>

          {/* Spark Quota Summary in 1 line */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 shadow-2xs flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-[#1A1A2E] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#F5A623]" />
              <span>Batas Kuota Gratis:</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-mono">
              <span>1 GB Storage</span>
              <span>•</span>
              <span>50k Baca</span>
              <span>•</span>
              <span>20k Tulis</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
