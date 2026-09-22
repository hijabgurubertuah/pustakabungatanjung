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
} from 'lucide-react';

export const KelolaAkunAdmin: React.FC = () => {
  const {
    admins,
    addAdmin,
    updateAdmin,
    deleteAdmin,
    resetAdminPassword,
    currentUser,
    logoUrl,
    syncAllToFirebase,
    showToast,
  } = useLibrary();

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
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto">
        <Shield className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h3 className="font-bold text-slate-800 text-sm font-heading">Akses Terbatas</h3>
        <p className="text-xs text-slate-500 mt-1">
          Hanya Superadmin yang memiliki izin mengelola akun dan mencetak kartu pengurus perpustakaan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Manajemen Akun & Kartu Petugas</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data pengurus, hak akses, dan terbitkan Kartu Petugas resmi dengan barcode scan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sync to Firebase Button */}
          <button
            type="button"
            onClick={async () => {
              await syncAllToFirebase();
            }}
            className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-sky-200 cursor-pointer shadow-xs"
            title="Simpan seluruh data admin & sistem ke Cloud Firebase Firestore"
          >
            <CloudUpload className="w-4 h-4 text-sky-600" />
            <span>Simpan ke Firebase</span>
          </button>

          {/* Print All Admin Cards Button */}
          <button
            type="button"
            onClick={() => setIsBatchPrintModal(true)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-emerald-200/80 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span>Cetak Semua Kartu</span>
          </button>

          {/* Add Admin Button */}
          <button
            type="button"
            onClick={openAddModal}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akun Admin</span>
          </button>
        </div>
      </div>

      {/* Admin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start gap-3.5">
              <img
                src={
                  admin.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                }
                alt={admin.name}
                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-bold text-slate-900 text-sm truncate">{admin.name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      admin.role === 'superadmin'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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

      {/* ========================================================================= */}
      {/* SINGLE PRINTABLE ADMIN CARD MODAL                                         */}
      {/* ========================================================================= */}
      {selectedCardAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-heading">
                  Kartu Tanda Petugas Perpustakaan
                </h3>
                <p className="text-xs text-slate-500">
                  Format cetak resmi dengan Barcode Scan Login
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardAdmin(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CARD GRAPHIC (PRINT READY) */}
            <div className="bg-gradient-to-br from-[#041a14] via-[#082a20] to-[#02130e] text-white rounded-2xl p-5 shadow-2xl relative overflow-hidden border border-emerald-500/30">
              {/* Decorative radial background glow */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-emerald-400/20 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <SMPN1Logo customUrl={logoUrl} className="w-8 h-9 object-contain shrink-0" />
                  <div className="text-left">
                    <div className="text-[11px] font-extrabold tracking-wide uppercase font-serif">
                      SMP NEGERI 1 BENGKALIS
                    </div>
                    <div className="text-[9px] text-emerald-300 font-semibold uppercase tracking-wider">
                      Perpustakaan Bunga Tanjung
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full tracking-wider uppercase border ${
                    selectedCardAdmin.role === 'superadmin'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
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
                  className="w-20 h-24 object-cover rounded-xl border-2 border-emerald-400/40 shrink-0 bg-slate-900 shadow-md"
                />
                <div className="space-y-1 min-w-0 text-left">
                  <div className="text-sm font-extrabold text-white truncate font-serif">
                    {selectedCardAdmin.name}
                  </div>
                  <div className="text-[11px] text-emerald-200">
                    Jabatan:{' '}
                    <span className="text-emerald-100 font-bold">
                      {selectedCardAdmin.role === 'superadmin'
                        ? 'Kepala Perpustakaan / Superadmin'
                        : 'Petugas Layanan Perpustakaan'}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-200">
                    NIP/ID:{' '}
                    <span className="text-white font-mono font-bold">
                      {selectedCardAdmin.nipOrId || selectedCardAdmin.username}
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-300/80">
                    Username: <span className="font-mono">@{selectedCardAdmin.username}</span>
                  </div>
                  <div className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Status: Pengurus Aktif</span>
                  </div>
                </div>
              </div>

              {/* Scannable Barcode for direct camera login */}
              <div className="mt-3.5 pt-2 bg-white rounded-xl p-2 flex flex-col items-center justify-center shadow-inner text-slate-800">
                <BarcodeDisplay
                  value={
                    selectedCardAdmin.nipOrId ||
                    selectedCardAdmin.username ||
                    selectedCardAdmin.id
                  }
                  height={36}
                  width={1.5}
                />
                <div className="text-[9px] text-slate-500 font-medium tracking-tight mt-0.5">
                  Scan barcode ini dengan kamera login admin untuk akses cepat
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Kartu Petugas</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCardAdmin(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
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
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-heading">
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Lembar A4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBatchPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid of Printable Admin Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              {admins.map((adm) => (
                <div
                  key={adm.id}
                  className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3"
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

      {/* ========================================================================= */}
      {/* ADD / EDIT ADMIN MODAL (WITH CAMERA PHOTO CAPTURE)                        */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base font-heading">
                {editingAdmin ? 'Ubah Akun Petugas' : 'Tambah Akun Petugas Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Photo & Camera Section */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <img
                  src={
                    formData.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                  }
                  alt="Preview"
                  className="w-14 h-14 rounded-xl object-cover border border-slate-300 bg-white shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="font-semibold text-slate-700 text-xs">Foto Petugas</div>
                  <button
                    type="button"
                    onClick={() => setIsCameraPhotoOpen(true)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-indigo-200 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ambil Foto Kamera</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar Petugas
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Hj. Nurbaity, M.Pd."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        username: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                      })
                    }
                    placeholder="nama_petugas"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran / Hak Akses</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
                  >
                    <option value="admin">Admin Perpustakaan</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIP / ID Petugas (Barcode Login)
                </label>
                <input
                  type="text"
                  value={formData.nipOrId}
                  onChange={(e) => setFormData({ ...formData, nipOrId: e.target.value })}
                  placeholder="Contoh: 197508122000032004 atau ADM-001"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-slate-800"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nomor ini dicetak sebagai barcode pada kartu admin dan dapat di-scan langsung di login
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Petugas</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama@smpn1bengkalis.sch.id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Simpan Akun Petugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CAMERA PHOTO MODAL FOR ADMIN PHOTO CAPTURE                                */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* RESET PASSWORD MODAL                                                      */}
      {/* ========================================================================= */}
      {resetModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm font-heading">
              Reset Password: {resetModalAdmin.name}
            </h3>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password Baru</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalAdmin(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold cursor-pointer"
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
