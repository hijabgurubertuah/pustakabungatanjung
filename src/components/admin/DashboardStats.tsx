import React from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  BookOpen,
  Users,
  BookmarkCheck,
  TrendingUp,
  Award,
  CalendarCheck,
  BarChart3,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';

export const DashboardStats: React.FC = () => {
  const { books, students, transactions, visits } = useLibrary();

  // Computations
  const totalBooks = books.reduce((acc, b) => acc + b.totalCopies, 0);
  const totalAvailable = books.reduce((acc, b) => acc + b.availableCopies, 0);
  const activeLoans = transactions.filter((t) => t.status !== 'Kembali');
  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter((v) => v.dateStr === todayStr);

  // Top Borrowed Books
  const borrowCounts: { [title: string]: number } = {};
  transactions.forEach((t) => {
    borrowCounts[t.bookTitle] = (borrowCounts[t.bookTitle] || 0) + 1;
  });

  const topBooksData = Object.entries(borrowCounts)
    .map(([title, count]) => ({
      name: title.length > 20 ? title.substring(0, 18) + '...' : title,
      fullTitle: title,
      peminjaman: count,
    }))
    .sort((a, b) => b.peminjaman - a.peminjaman)
    .slice(0, 5);

  // If no transactions yet, provide sample structured distribution
  const chartTopBooks =
    topBooksData.length > 0
      ? topBooksData
      : [
          { name: 'IPA SMP Kelas VII', fullTitle: 'IPA SMP Kelas VII', peminjaman: 12 },
          { name: 'Matematika Kls VIII', fullTitle: 'Matematika SMP Kelas VIII', peminjaman: 10 },
          { name: 'Laskar Pelangi', fullTitle: 'Laskar Pelangi', peminjaman: 8 },
          { name: 'Hujan - Tere Liye', fullTitle: 'Hujan - Tere Liye', peminjaman: 7 },
          { name: 'Sejarah Melayu', fullTitle: 'Sejarah Melayu Riau', peminjaman: 5 },
        ];

  // Monthly Loan Trend
  const monthlyLoanData = [
    { bulan: 'Apr', total: 24 },
    { bulan: 'Mei', total: 38 },
    { bulan: 'Jun', total: 18 },
    { bulan: 'Jul', total: 45 },
    { bulan: 'Agu', total: 52 },
    { bulan: 'Sep', total: 48 + activeLoans.length },
  ];

  // Top 5 Active Visitor Students (Reward Leaderboard)
  const sortedStudents = [...students].sort((a, b) => b.visitCount - a.visitCount).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Koleksi */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Koleksi</span>
            <div className="w-9 h-9 rounded-xl bg-[#F5F7FA] text-[#1E3A5F] flex items-center justify-center border border-[#E2E8F0]">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1A1A2E] font-heading">{totalBooks}</span>
            <span className="text-xs text-slate-500 font-medium">eksemplar</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block" />
            <span>Tersedia: <strong className="text-[#1A1A2E]">{totalAvailable}</strong> buku</span>
          </div>
        </div>

        {/* Buku Dipinjam */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Buku Dipinjam</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F5A623] flex items-center justify-center border border-amber-200">
              <BookmarkCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1A1A2E] font-heading">{activeLoans.length}</span>
            <span className="text-xs text-slate-500 font-medium">transaksi aktif</span>
          </div>
          <div className="mt-1 text-xs text-[#F59E0B] font-semibold">
            {transactions.filter((t) => t.status === 'Terlambat').length} melewati jatuh tempo
          </div>
        </div>

        {/* Anggota Siswa */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Anggota Siswa</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1A1A2E] font-heading">{students.length}</span>
            <span className="text-xs text-slate-500 font-medium">terdaftar</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            SMPN 1 Bengkalis
          </div>
        </div>

        {/* Kunjungan Hari Ini */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Kunjungan Hari Ini</span>
            <div className="w-9 h-9 rounded-xl bg-[#F5F7FA] text-[#1E3A5F] flex items-center justify-center border border-[#E2E8F0]">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1A1A2E] font-heading">{todayVisits.length}</span>
            <span className="text-xs text-slate-500 font-medium">siswa hadir</span>
          </div>
          <div className="mt-1 text-xs text-[#1E3A5F] font-semibold">
            Total {visits.length} riwayat kunjungan
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Area Chart */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1E3A5F]" />
              <h3 className="text-sm font-bold text-[#1A1A2E] font-heading">Tren Peminjaman Bulanan</h3>
            </div>
            <span className="text-xs font-medium text-slate-400">Tahun 2026</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyLoanData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="loanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="bulan" tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1A1A2E', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#F5A623' }}
                />
                <Area type="monotone" dataKey="total" stroke="#1E3A5F" strokeWidth={2.5} fillOpacity={1} fill="url(#loanGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Borrowed Books Bar Chart */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#F5A623]" />
              <h3 className="text-sm font-bold text-[#1A1A2E] font-heading">Buku Paling Sering Dipinjam</h3>
            </div>
            <span className="text-xs font-medium text-slate-400">Top 5</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartTopBooks} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#1A1A2E', fontSize: 11 }} width={110} />
                <Tooltip
                  formatter={(value: any) => [`${value} kali`, 'Peminjaman']}
                  labelFormatter={(name) => `Judul: ${name}`}
                  contentStyle={{ backgroundColor: '#1A1A2E', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="peminjaman" fill="#F5A623" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reward Leaderboard: Most Active Visitors */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#F5A623]" />
            <h3 className="text-sm font-bold text-[#1A1A2E] font-heading">
              Peringkat Pengunjung Teraktif (Apresiasi Minat Baca)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Program Reward Sekolah</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F5F7FA] border-b border-[#E2E8F0] text-slate-600 font-semibold">
                <th className="py-3 px-4 w-16 text-center">Peringkat</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">ID Anggota / NISN</th>
                <th className="py-3 px-4 text-right">Total Kunjungan</th>
                <th className="py-3 px-4 text-center">Status Reward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {sortedStudents.map((s, idx) => (
                <tr key={s.id} className="hover:bg-[#F5F7FA]">
                  <td className="py-3 px-4 text-center font-bold">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <img src={s.photoUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      <span className="font-semibold text-slate-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{s.classGrade}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{s.id}</td>
                  <td className="py-3 px-4 text-right font-bold text-[#1E3A5F] text-sm">
                    {s.visitCount}x
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-800'
                          : idx < 3
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx === 0 ? 'Peringkat 1' : idx < 3 ? 'Kandidat Reward' : 'Aktif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
