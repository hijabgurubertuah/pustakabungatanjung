import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { AdminUser } from '../../types';
import { SMPN1Logo } from '../common/SMPN1Logo';
import { BarcodeDisplay } from '../common/BarcodeDisplay';
import { CameraPhotoModal } from '../common/CameraPhotoModal';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  Edit2,
  Trash2,
  X,
  Check,
  Mail,
  User,
  Shield,
  Lock,
  Printer,
  IdCard,
  Camera,
  Sparkles,
  QrCode,
  CheckCircle2,
  CloudUpload,
  FileSpreadsheet,
  Plus,
  Info,
} from 'lucide-react';

export const KelolaAkunAdmin: React.FC = () => {
  // View Mode State
  const [viewMode, setViewMode] = useState<'cards' | 'spreadsheet'>('spreadsheet');
  const {
    admins,
    addAdmin,
    updateAdmin,
    deleteAdmin,
    resetAdminPassword,
    currentUser,
    logoUrl,
    syncAllToFirebase,
    syncCollectionToFirebase,
    showToast,
  } = useLibrary();

  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);

  const handleSyncAdmins = async () => {
    setIsSavingToFirebase(true);
    await syncCollectionToFirebase('admins');
    setIsSavingToFirebase(false);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [resetModalAdmin, setResetModalAdmin] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Printable Single Admin Card Modal
  const [selectedCardAdmin, setSelectedCardAdmin] = useState<AdminUser | null>(null);

  // Batch Print All Admin Cards Modal
  const [isBatchPrintModal, setIsBatchPrintModal] = useState(false);

  // Camera Photo Modal for taking admin photo
  const [isCameraPhotoOpen, setIsCameraPhotoOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    nipOrId: '',
    email: '',
    role: 'admin' as 'superadmin' | 'admin',
    passwordHash: 'admin123',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  const isSuperadmin = currentUser?.role === 'superadmin';

  const openAddModal = () => {
    setEditingAdmin(null);
    setFormData({
      username: '',
      name: '',
      nipOrId: '',
      email: '',
      role: 'admin',
      passwordHash: 'admin123',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      name: admin.name,
      nipOrId: admin.nipOrId,
      email: admin.email,
      role: admin.role,
      passwordHash: admin.passwordHash,
      avatarUrl: admin.avatarUrl || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username) {
      showToast('error', 'Validasi Gagal', 'Lengkapi nama dan username');
      return;
    }

    if (editingAdmin) {
      updateAdmin(editingAdmin.id, formData);
      showToast('success', 'Akun Diperbarui', `Data ${formData.name} berhasil disimpan`);
    } else {
      addAdmin(formData);
      showToast('success', 'Akun Ditambahkan', `Akun petugas ${formData.name} siap digunakan`);
    }
    setIsModalOpen(false);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalAdmin || !newPassword.trim()) {
      showToast('error', 'Gagal', 'Masukkan password baru');
      return;
    }
    resetAdminPassword(resetModalAdmin.id, newPassword.trim());
    setResetModalAdmin(null);
    setNewPassword('');
    showToast('success', 'Password Direset', `Password untuk ${resetModalAdmin.name} berhasil diubah`);
  };

  if (!isSuperadmin) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center max-w-md mx-auto">
        <Shield className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h3 className="font-bold text-[#1A1A2E] text-sm font-heading">Akses Terbatas</h3>
        <p className="text-xs text-slate-500 mt-1">
          Hanya Superadmin yang memiliki izin mengelola akun dan mencetak kartu pengurus perpustakaan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-[#1A1A2E] font-heading flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1E3A5F]" />
            <span>Manajemen Akun & Kartu Petugas</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data pengurus, hak akses, dan terbitkan Kartu Petugas resmi dengan barcode scan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-[#F5F7FA] p-1 rounded-xl border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition select-none ${
                viewMode === 'cards'
                  ? 'bg-white text-[#1E3A5F] shadow-xs'
                  : 'text-slate-500 hover:text-[#1A1A2E]'
              }`}
            >
              <IdCard className="w-4 h-4 text-[#1E3A5F]" />
              <span>Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('spreadsheet')}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition select-none ${
                viewMode === 'spreadsheet'
                  ? 'bg-[#1E3A5F] text-white shadow-xs'
                  : 'text-slate-500 hover:text-[#1A1A2E]'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-[#F5A623]" />
              <span>Sel Spreadsheet</span>
            </button>
          </div>

          {/* Sync to Firebase Button */}
          <button
            type="button"
            onClick={handleSyncAdmins}
            disabled={isSavingToFirebase}
            className="min-h-[44px] px-3.5 py-2 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Sinkronkan data akun admin ke Cloud Firebase Firestore"
          >
            <CloudUpload className="w-4 h-4 text-[#F5A623]" />
            <span>{isSavingToFirebase ? 'Menyimpan...' : 'Simpan ke Firebase'}</span>
          </button>

          {/* Print All Admin Cards Button */}
          <button
            type="button"
            onClick={() => setIsBatchPrintModal(true)}
            className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-[#F5F7FA] active:bg-slate-100 text-[#1E3A5F] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-[#E2E8F0] cursor-pointer shadow-2xs"
            title="Cetak Semua Kartu Petugas"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak Semua Kartu</span>
          </button>

          {/* Add Admin Button */}
          <button
            type="button"
            onClick={openAddModal}
            className="min-h-[44px] px-4 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer select-none"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akun Admin</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN SPREADSHEET ADMIN (EXCEL/GOOGLE SHEETS GRID VIEW)               */}
      {/* ========================================================================= */}
      {viewMode === 'spreadsheet' ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {/* Header toolbar Excel */}
          <div className="bg-[#F5F7FA] border-b border-[#E2E8F0] p-2.5 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 text-[#1A1A2E] font-semibold">
              <FileSpreadsheet className="w-4 h-4 text-[#1E3A5F]" />
              <span>Mode Sel Spreadsheet Akun Petugas</span>
              <span className="text-[10px] bg-white text-[#1E3A5F] font-bold px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                {admins.length} Baris Petugas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openAddModal}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tambah Baris</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                {/* Column Headers (A, B, C, D...) */}
                <tr className="bg-slate-200/80 text-slate-600 text-[11px] font-mono border-b border-slate-300">
                  <th className="w-10 p-1.5 text-center border-r border-slate-300 bg-slate-300/60 font-bold">#</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[140px]">A: Username</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[180px]">B: Nama Lengkap</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[140px]">C: NIP / ID Petugas</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[180px]">D: Email</th>
                  <th className="p-1.5 border-r border-slate-300 font-bold text-slate-700 min-w-[120px]">E: Hak Akses Role</th>
                  <th className="p-1.5 text-center min-w-[120px]">F: Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {admins.map((adm, index) => (
                  <tr key={adm.id} className="hover:bg-[#F5F7FA] transition-colors">
                    {/* Row Number */}
                    <td className="p-1.5 text-center font-mono text-[11px] font-bold bg-[#F5F7FA] text-slate-500 border-r border-[#E2E8F0] select-none">
                      {index + 1}
                    </td>

                    {/* Username Cell */}
                    <td className="p-0 border-r border-[#E2E8F0]">
                      <input
                        type="text"
                        value={adm.username}
                        onChange={(e) => updateAdmin(adm.id, { username: e.target.value })}
                        className="w-full h-full px-2 py-1.5 bg-transparent font-mono font-bold text-[#1A1A2E] focus:bg-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none border-none rounded-none text-xs"
                      />
                    </td>

                    {/* Nama Cell */}
                    <td className="p-0 border-r border-[#E2E8F0]">
                      <input
                        type="text"
                        value={adm.name}
                        onChange={(e) => updateAdmin(adm.id, { name: e.target.value })}
                        className="w-full h-full px-2 py-1.5 bg-transparent font-bold text-[#1A1A2E] focus:bg-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none border-none rounded-none text-xs"
                      />
                    </td>

                    {/* NIP/ID Cell */}
                    <td className="p-0 border-r border-[#E2E8F0]">
                      <input
                        type="text"
                        value={adm.nipOrId || ''}
                        placeholder="NIP / ID..."
                        onChange={(e) => updateAdmin(adm.id, { nipOrId: e.target.value })}
                        className="w-full h-full px-2 py-1.5 bg-transparent font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none border-none rounded-none text-xs"
                      />
                    </td>

                    {/* Email Cell */}
                    <td className="p-0 border-r border-[#E2E8F0]">
                      <input
                        type="email"
                        value={adm.email || ''}
                        placeholder="email@..."
                        onChange={(e) => updateAdmin(adm.id, { email: e.target.value })}
                        className="w-full h-full px-2 py-1.5 bg-transparent text-slate-700 focus:bg-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none border-none rounded-none text-xs"
                      />
                    </td>

                    {/* Role Cell */}
                    <td className="p-0 border-r border-[#E2E8F0]">
                      <select
                        value={adm.role}
                        onChange={(e) => updateAdmin(adm.id, { role: e.target.value as 'superadmin' | 'admin' })}
                        className="w-full h-full px-2 py-1.5 bg-transparent font-bold text-[#1E3A5F] focus:bg-white focus:ring-2 focus:ring-[#F5A623] focus:outline-none border-none rounded-none text-xs"
                      >
                        <option value="admin">Admin Perpustakaan</option>
                        <option value="superadmin">Superadmin Utama</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="p-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCardAdmin(adm)}
                          className="min-h-[32px] min-w-[32px] flex items-center justify-center text-[#1E3A5F] hover:bg-[#F5F7FA] rounded-lg cursor-pointer transition-colors"
                          title="Cetak Kartu Petugas"
                        >
                          <IdCard className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetModalAdmin(adm)}
                          className="min-h-[32px] min-w-[32px] flex items-center justify-center text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(adm)}
                          className="p-1 text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                          title="Ubah Lengkap"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {adm.id !== currentUser?.adminData?.id && (
                          <button
                            type="button"
                            onClick={() => deleteAdmin(adm.id)}
                            className="p-1 text-rose-500 hover:bg-rose-100 rounded cursor-pointer"
                            title="Hapus Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Admin Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start gap-3.5">
              <img
                src={
                  admin.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                }
                alt={admin.name}
                className="w-14 h-14 rounded-xl object-cover border border-[#E2E8F0] shrink-0 bg-[#F5F7FA]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-bold text-[#1A1A2E] text-sm truncate">{admin.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      admin.role === 'superadmin'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-[#F5F7FA] text-[#1E3A5F] border border-[#E2E8F0]'
                    }`}
                  >
                    {admin.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">@{admin.username}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  NIP/ID: {admin.nipOrId || '-'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{admin.email}</div>
              </div>
            </div>

            {/* Actions: Kartu Petugas + Reset + Edit + Delete */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {/* Button to Open & Print Admin Card */}
                <button
                  type="button"
                  onClick={() => setSelectedCardAdmin(admin)}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer"
                  title="Lihat dan Cetak Kartu Tanda Petugas"
                >
                  <IdCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kartu Petugas</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetModalAdmin(admin);
                    setNewPassword('');
                  }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset Password"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(admin)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Ubah Data"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (admins.length <= 1) {
                      showToast('error', 'Gagal', 'Tidak dapat menghapus akun admin terakhir');
                      return;
                    }
                    if (window.confirm(`Hapus akun admin ${admin.name}?`)) {
                      deleteAdmin(admin.id);
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Akun"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE PRINTABLE ADMIN CARD MODAL                                         */}
      {/* ========================================================================= */}
      {selectedCardAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-md w-full p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="font-bold text-[#1A1A2E] text-base font-heading">
                  Kartu Tanda Petugas Perpustakaan
                </h3>
                <p className="text-xs text-slate-500">
                  Format cetak resmi dengan Barcode Scan Login
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardAdmin(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CARD GRAPHIC (PRINT READY) */}
            <div className="bg-gradient-to-br from-[#1E3A5F] via-[#142842] to-[#0A1624] text-white rounded-xl p-5 shadow-2xl relative overflow-hidden border border-white/10">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <SMPN1Logo customUrl={logoUrl} className="w-8 h-9 object-contain shrink-0" />
                  <div className="text-left">
                    <div className="text-[11px] font-extrabold tracking-wide uppercase font-heading">
                      SMP NEGERI 1 BENGKALIS
                    </div>
                    <div className="text-[9px] text-[#F5A623] font-semibold uppercase tracking-wider">
                      Perpustakaan Bunga Tanjung
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded tracking-wider uppercase ${
                    selectedCardAdmin.role === 'superadmin'
                      ? 'bg-[#F5A623] text-[#1A1A2E]'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {selectedCardAdmin.role === 'superadmin' ? 'SUPERADMIN' : 'PETUGAS'}
                </span>
              </div>

              {/* Card Body */}
              <div className="flex gap-3.5 items-center">
                <img
                  src={
                    selectedCardAdmin.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                  }
                  alt={selectedCardAdmin.name}
                  className="w-20 h-24 object-cover rounded-lg border-2 border-white/30 shrink-0 bg-slate-900 shadow-md"
                />
                <div className="space-y-1 min-w-0 text-left">
                  <div className="text-sm font-extrabold text-white truncate font-heading">
                    {selectedCardAdmin.name}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Jabatan:{' '}
                    <span className="text-white font-bold">
                      {selectedCardAdmin.role === 'superadmin'
                        ? 'Kepala Perpustakaan / Superadmin'
                        : 'Petugas Layanan Perpustakaan'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    NIP/ID:{' '}
                    <span className="text-white font-mono font-bold">
                      {selectedCardAdmin.nipOrId || selectedCardAdmin.username}
                    </span>
                  </div>
                  <div className="text-[10px] text-[#F5A623]">
                    Username: <span className="font-mono">@{selectedCardAdmin.username}</span>
                  </div>
                </div>
              </div>

              {/* Scannable Barcode */}
              <div className="mt-3.5 pt-2 bg-white rounded-lg p-2 flex flex-col items-center justify-center text-slate-800">
                <BarcodeDisplay
                  value={
                    selectedCardAdmin.nipOrId ||
                    selectedCardAdmin.username ||
                    selectedCardAdmin.id
                  }
                  height={36}
                  width={1.5}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 min-h-[44px] py-2.5 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#F5A623]" />
                <span>Cetak Kartu Petugas</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCardAdmin(null)}
                className="min-h-[44px] px-4 py-2.5 bg-[#F5F7FA] hover:bg-slate-200 active:bg-slate-300 text-[#1A1A2E] border border-[#E2E8F0] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BATCH PRINT ALL ADMIN CARDS MODAL                                         */}
      {/* ========================================================================= */}
      {isBatchPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h3 className="font-bold text-[#1A1A2E] text-base font-heading">
                  Cetak Lembar Kartu Petugas Perpustakaan ({admins.length} Akun)
                </h3>
                <p className="text-xs text-slate-500">
                  Format siap cetak lembar standar dengan barcode scan login aktif
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="min-h-[44px] px-4 py-2 bg-[#1E3A5F] hover:bg-[#162C47] active:bg-[#0F1F33] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#F5A623]" />
                  <span>Cetak Lembar A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchPrintModal(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Grid of Printable Admin Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-[#F5F7FA] rounded-xl border border-[#E2E8F0]">
              {admins.map((adm) => (
                <div
                  key={adm.id}
                  className="bg-white border-2 border-slate-300 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5">
                      <SMPN1Logo customUrl={logoUrl} className="w-6 h-7 object-contain" />
                      <div>
                        <div className="text-[10px] font-bold leading-none text-slate-900">
                          SMP NEGERI 1 BENGKALIS
                        </div>
                        <div className="text-[8px] text-emerald-700 font-semibold uppercase">
                          Perpustakaan Bunga Tanjung
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        adm.role === 'superadmin'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {adm.role === 'superadmin' ? 'SUPERADMIN' : 'PETUGAS'}
                    </span>
                  </div>

                  <div className="flex gap-3 items-center">
                    <img
                      src={
                        adm.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                      }
                      alt=""
                      className="w-16 h-20 object-cover rounded-lg border border-slate-300 bg-slate-100"
                    />
                    <div className="space-y-0.5 min-w-0 text-left">
                      <div className="text-xs font-bold text-slate-900 truncate">{adm.name}</div>
                      <div className="text-[10px] text-slate-600">
                        {adm.role === 'superadmin'
                          ? 'Kepala Perpustakaan / Superadmin'
                          : 'Petugas Perpustakaan'}
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono">
                        NIP/ID: {adm.nipOrId || adm.username}
                      </div>
                      <div className="text-[9px] text-slate-500">@{adm.username}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex flex-col items-center bg-slate-50 rounded-lg p-1.5">
                    <BarcodeDisplay
                      value={adm.nipOrId || adm.username || adm.id}
                      height={28}
                      width={1.2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT ADMIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-bold text-[#1A1A2E] text-base font-heading">
                {editingAdmin ? 'Ubah Akun Petugas' : 'Tambah Akun Petugas Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Photo & Camera Section */}
              <div className="flex items-center gap-3 bg-[#F5F7FA] p-3 rounded-xl border border-[#E2E8F0]">
                <img
                  src={
                    formData.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                  }
                  alt="Preview"
                  className="w-14 h-14 rounded-lg object-cover border border-[#E2E8F0] bg-white shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="font-semibold text-[#1A1A2E] text-xs">Foto Petugas</div>
                  <button
                    type="button"
                    onClick={() => setIsCameraPhotoOpen(true)}
                    className="min-h-[40px] px-3 py-1.5 bg-white hover:bg-[#F5F7FA] active:bg-slate-100 text-[#1E3A5F] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-[#E2E8F0] cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#1E3A5F]" />
                    <span>Ambil Foto Kamera</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A2E] mb-1">
                  Nama Lengkap & Gelar Petugas
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="cth: Hj. Nurbaity, M.Pd."
                  className="w-full min-h-[44px] px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1A1A2E] mb-1">Username Login</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                      })
                    }
                    placeholder="cth: nurbaity"
                    className="w-full min-h-[44px] px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1A1A2E] mb-1">Peran / Hak Akses</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full min-h-[44px] px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="admin">Admin Perpustakaan</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A2E] mb-1">
                  NIP / ID Petugas (Barcode Login)
                </label>
                <input
                  type="text"
                  value={formData.nipOrId}
                  onChange={(e) => setFormData({ ...formData, nipOrId: e.target.value })}
                  placeholder="cth: 197508122000032004 atau ADM-001"
                  className="w-full min-h-[44px] px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1A1A2E] mb-1">Email Petugas</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cth: nurbaity@sekolah.sch.id"
                  className="w-full min-h-[44px] px-3 py-2 bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 bg-[#F5F7FA] hover:bg-slate-200 active:bg-slate-300 text-[#1A1A2E] border border-[#E2E8F0] rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] rounded-xl font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAMERA PHOTO MODAL FOR ADMIN PHOTO CAPTURE */}
      {isCameraPhotoOpen && (
        <CameraPhotoModal
          isOpen={isCameraPhotoOpen}
          onClose={() => setIsCameraPhotoOpen(false)}
          title="Foto Petugas Perpustakaan"
          onCapture={(photoDataUrl) => {
            setFormData((prev) => ({ ...prev, avatarUrl: photoDataUrl }));
            setIsCameraPhotoOpen(false);
            showToast('success', 'Foto Disimpan', 'Foto petugas berhasil diambil');
          }}
        />
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E2E8F0] max-w-sm w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-[#1A1A2E] text-sm font-heading">
              Reset Password: {resetModalAdmin.name}
            </h3>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block font-semibold text-[#1A1A2E] mb-1">Password Baru</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="cth: Rahasia123"
                    className="w-full pl-9 pr-3 py-2.5 min-h-[44px] bg-[#F5F7FA] border border-[#E2E8F0] rounded-xl text-xs text-[#1A1A2E] placeholder:text-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:bg-white transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalAdmin(null)}
                  className="min-h-[44px] px-3.5 py-2 bg-[#F5F7FA] hover:bg-slate-200 active:bg-slate-300 text-[#1A1A2E] border border-[#E2E8F0] rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 bg-[#F5A623] hover:bg-[#E09618] active:bg-[#C88410] text-[#1A1A2E] rounded-xl font-bold cursor-pointer transition-colors"
                >
                  Terapkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
