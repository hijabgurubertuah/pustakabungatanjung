import React, { useState, useMemo, useEffect } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Book, BookCondition } from '../../types';
import { BarcodeDisplay } from '../common/BarcodeDisplay';
import { CameraPhotoModal } from '../common/CameraPhotoModal';
import { compressImageFile } from '../../lib/imageUtils';
import { uploadImageToDrive } from '../../lib/driveAppsScript';
import {
  downloadBookTemplateCSV,
  exportBooksToCSVFile,
  parseBookCSV,
  fetchGoogleSheetsCSV,
  ParsedBookRow,
} from '../../lib/csvHelper';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  BookOpen,
  Image as ImageIcon,
  X,
  Check,
  Tag,
  Printer,
  UploadCloud,
  MapPin,
  Eye,
  Info,
  Camera,
  HardDrive,
  Loader2,
  FileSpreadsheet,
  Grid,
  Table,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Copy,
  Save,
  CheckCircle2,
  AlertTriangle,
  Link,
  Layers,
  ArrowRight,
  FileText,
} from 'lucide-react';

const CATEGORIES = [
  'Semua Kategori',
  'Buku Pelajaran',
  'Novel & Sastra',
  'Sejarah & Budaya',
  'Ensiklopedia & Referensi',
  'Kamus & Bahasa',
  'Teknologi & Komputer',
  'Agama & Budi Pekerti',
  'Komik Edukasi',
];

const CONDITIONS: BookCondition[] = ['Sangat Baik', 'Baik', 'Rusak Sedang', 'Rusak Parah'];

export const KelolaBuku: React.FC = () => {
  const { books, addBook, updateBook, deleteBook, showToast, appsScriptUrl, driveFolderId, syncCollectionToFirebase } = useLibrary();

  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);

  const handleSyncBooks = async () => {
    setIsSavingToFirebase(true);
    await syncCollectionToFirebase('books');
    setIsSavingToFirebase(false);
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua Kategori');
  const [selectedCondition, setSelectedCondition] = useState<string>('Semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [barcodePrintBook, setBarcodePrintBook] = useState<Book | null>(null);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // View Mode: 'table' or 'spreadsheet'
  const [viewMode, setViewMode] = useState<'table' | 'spreadsheet'>('spreadsheet');

  // Import Modal & Google Sheets Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGoogleSheetsModal, setShowGoogleSheetsModal] = useState(false);
  const [rawImportText, setRawImportText] = useState('');
  const [importSource, setImportSource] = useState<'file' | 'text'>('file');
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState(() => {
    return localStorage.getItem('google_sheets_csv_url_buku') || '';
  });
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [parsedImportRows, setParsedImportRows] = useState<ParsedBookRow[]>([]);

  // Parse CSV text on change
  const handleParseImportCSVText = (text: string) => {
    setRawImportText(text);
    if (!text.trim()) {
      setParsedImportRows([]);
      return;
    }
    const parsed = parseBookCSV(text, books);
    setParsedImportRows(parsed);
  };

  const handleFileUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          handleParseImportCSVText(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExecuteImport = () => {
    const validRows = parsedImportRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      showToast('error', 'Tidak Ada Data Valid', 'Pastikan data CSV memiliki judul buku yang valid.');
      return;
    }

    let addedCount = 0;
    let updatedCount = 0;

    validRows.forEach((row) => {
      const existing = books.find(
        (b) => b.barcode.toLowerCase().trim() === row.barcode.toLowerCase().trim()
      );

      if (existing) {
        updateBook(existing.id, {
          title: row.title,
          author: row.author,
          publisher: row.publisher,
          category: row.category,
          publishYear: row.publishYear,
          entryYear: row.entryYear,
          totalCopies: row.totalCopies,
          condition: row.condition,
          shelfLocation: row.shelfLocation,
          synopsis: row.synopsis,
          coverUrl: row.coverUrl || existing.coverUrl,
        });
        updatedCount++;
      } else {
        addBook({
          barcode: row.barcode,
          title: row.title,
          author: row.author,
          publisher: row.publisher,
          category: row.category,
          publishYear: row.publishYear,
          entryYear: row.entryYear,
          totalCopies: row.totalCopies,
          condition: row.condition,
          shelfLocation: row.shelfLocation,
          synopsis: row.synopsis,
          coverUrl: row.coverUrl,
        });
        addedCount++;
      }
    });

    showToast(
      'success',
      'Impor Berhasil',
      `Berhasil memperbarui ${updatedCount} buku dan menambahkan ${addedCount} buku baru.`
    );

    setShowImportModal(false);
    setRawImportText('');
    setParsedImportRows([]);
  };

  const handleSyncGoogleSheetsCSV = async (urlToSync?: string) => {
    const targetUrl = (urlToSync || googleSheetsUrl).trim();
    if (!targetUrl) {
      showToast('error', 'Link Kosong', 'Masukkan Tautan CSV Google Sheets terlebih dahulu');
      return;
    }

    setIsSyncingSheets(true);
    try {
      localStorage.setItem('google_sheets_csv_url_buku', targetUrl);
      setGoogleSheetsUrl(targetUrl);

      const csvContent = await fetchGoogleSheetsCSV(targetUrl);
      const parsed = parseBookCSV(csvContent, books);
      const validRows = parsed.filter((r) => r.isValid);

      if (validRows.length === 0) {
        showToast('warning', 'Data Tidak Ditemukan', 'Link CSV tidak mengembalikan baris buku yang valid.');
        return;
      }

      let addedCount = 0;
      let updatedCount = 0;

      validRows.forEach((row) => {
        const existing = books.find(
          (b) => b.barcode.toLowerCase().trim() === row.barcode.toLowerCase().trim()
        );

        if (existing) {
          updateBook(existing.id, {
            title: row.title,
            author: row.author,
            publisher: row.publisher,
            category: row.category,
            publishYear: row.publishYear,
            entryYear: row.entryYear,
            totalCopies: row.totalCopies,
            condition: row.condition,
            shelfLocation: row.shelfLocation,
            synopsis: row.synopsis,
            coverUrl: row.coverUrl || existing.coverUrl,
          });
          updatedCount++;
        } else {
          addBook({
            barcode: row.barcode,
            title: row.title,
            author: row.author,
            publisher: row.publisher,
            category: row.category,
            publishYear: row.publishYear,
            entryYear: row.entryYear,
            totalCopies: row.totalCopies,
            condition: row.condition,
            shelfLocation: row.shelfLocation,
            synopsis: row.synopsis,
            coverUrl: row.coverUrl,
          });
          addedCount++;
        }
      });

      showToast(
        'success',
        'Sinkronisasi Google Sheets Berhasil',
        `Memproses ${parsed.length} baris CSV. ${updatedCount} buku diperbarui & ${addedCount} buku baru ditambahkan.`
      );
      setShowGoogleSheetsModal(false);
    } catch (err: any) {
      showToast(
        'error',
        'Gagal Sinkronasi',
        err.message || 'Gagal mengambil data dari Google Sheets CSV. Pastikan link dipublikasikan sebagai CSV.'
      );
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Add a new empty row directly in Spreadsheet view (empty fields, placed at the very top)
  const handleAddNewGridRow = () => {
    // Reset filters so newly added row at top is immediately visible
    setSearchQuery('');
    setSelectedCategory('Semua Kategori');
    setSelectedCondition('Semua');

    addBook({
      barcode: '',
      title: '',
      author: '',
      publisher: '',
      category: 'Buku Pelajaran',
      publishYear: new Date().getFullYear(),
      entryYear: new Date().getFullYear(),
      totalCopies: 1,
      condition: 'Baik',
      shelfLocation: '',
      synopsis: '',
      coverUrl: '',
    });
  };
  const [formData, setFormData] = useState({
    barcode: '',
    title: '',
    author: '',
    publisher: '',
    category: 'Buku Pelajaran',
    publishYear: new Date().getFullYear(),
    entryYear: new Date().getFullYear(),
    totalCopies: 1,
    condition: 'Baik' as BookCondition,
    coverUrl: '',
    shelfLocation: '',
    synopsis: '',
  });

  // Filter books with multi-field search
  const filteredBooks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return books.filter((b) => {
      const matchQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.barcode.includes(q) ||
        String(b.publishYear).includes(q) ||
        String(b.entryYear).includes(q);

      const matchCategory =
        selectedCategory === 'Semua Kategori' || b.category === selectedCategory;

      const matchCondition =
        selectedCondition === 'Semua' || b.condition === selectedCondition;

      return matchQuery && matchCategory && matchCondition;
    });
  }, [books, searchQuery, selectedCategory, selectedCondition]);

  const openAddModal = () => {
    setEditingBook(null);
    const randomBarcode = '978' + Math.floor(1000000000 + Math.random() * 9000000000);
    setFormData({
      barcode: randomBarcode,
      title: '',
      author: '',
      publisher: '',
      category: 'Buku Pelajaran',
      publishYear: new Date().getFullYear(),
      entryYear: new Date().getFullYear(),
      totalCopies: 5,
      condition: 'Baik',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80',
      shelfLocation: 'Rak A1',
      synopsis: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setFormData({
      barcode: book.barcode,
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      category: book.category,
      publishYear: book.publishYear,
      entryYear: book.entryYear,
      totalCopies: book.totalCopies,
      condition: book.condition,
      coverUrl: book.coverUrl,
      shelfLocation: book.shelfLocation || '',
      synopsis: book.synopsis || '',
    });
    setIsModalOpen(true);
  };

  const processAndUploadCover = async (dataUrl: string, originalFileName?: string) => {
    setIsUploadingImage(true);
    try {
      if (appsScriptUrl && appsScriptUrl.startsWith('https://script.google.com/')) {
        showToast('info', 'Mengunggah ke Drive', 'Mengunggah foto sampul ke Google Drive...');
        const fName = originalFileName || `cover-${formData.barcode || Date.now()}.jpg`;
        const res = await uploadImageToDrive(appsScriptUrl, dataUrl, fName, 'image/jpeg', 'covers', driveFolderId);
        if (res.success && res.fileUrl) {
          setFormData((prev) => ({ ...prev, coverUrl: res.fileUrl! }));
          showToast('success', 'Tersimpan di Google Drive', 'Sampul buku disimpan di Google Drive (Folder: Sampul Buku)');
          return;
        }
      }
      // Fallback
      setFormData((prev) => ({ ...prev, coverUrl: dataUrl }));
      showToast(
        'success',
        'Sampul Diproses',
        appsScriptUrl ? 'Sampul disimpan ke sistem' : 'Hubungkan Google Apps Script di menu Sinkronisasi agar sampul tersimpan otomatis di Google Drive'
      );
    } catch (err: any) {
      setFormData((prev) => ({ ...prev, coverUrl: dataUrl }));
      showToast('error', 'Gagal Unggah Drive', err.message || 'Menggunakan data lokal');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file);
        await processAndUploadCover(compressed, file.name);
      } catch (err: any) {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            processAndUploadCover(reader.result as string, file.name);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.barcode) {
      showToast('error', 'Validasi Gagal', 'Lengkapi judul dan barcode');
      return;
    }

    if (editingBook) {
      updateBook(editingBook.id, {
        ...formData,
        publishYear: Number(formData.publishYear),
        entryYear: Number(formData.entryYear),
        totalCopies: Number(formData.totalCopies),
      });
    } else {
      addBook({
        ...formData,
        publishYear: Number(formData.publishYear),
        entryYear: Number(formData.entryYear),
        totalCopies: Number(formData.totalCopies),
      });
    }

    setIsModalOpen(false);
  };

  const getConditionBadge = (cond: BookCondition) => {
    switch (cond) {
      case 'Sangat Baik':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Baik':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Rusak Sedang':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Rusak Parah':
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Search, Filters & Add Button (Fully responsive, no overflow on mobile) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Search & Add Book Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul, pengarang, barcode..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* Row 2: View Switcher (Tabel vs Spreadsheet Grid) & Import/Export/Sheets Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          {/* View Mode Toggle (Pas Kanan Kiri di Tampilan HP) */}
          <div className="w-full sm:w-auto flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Tampilan Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('spreadsheet')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'spreadsheet'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Sel Spreadsheet</span>
            </button>
          </div>

          {/* Quick Import / Export & Google Sheets Actions (Seimbang Kanan Kiri Compact di HP) */}
          <div className="grid grid-cols-3 w-full sm:flex sm:w-auto items-center gap-1.5">
            <button
              type="button"
              onClick={() => exportBooksToCSVFile(filteredBooks)}
              className="w-full sm:w-auto px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer border border-slate-200 shadow-2xs"
              title="Ekspor Seluruh / Filter Data Buku ke File CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRawImportText('');
                setParsedImportRows([]);
                setShowImportModal(true);
              }}
              className="w-full sm:w-auto px-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer border border-slate-200 shadow-2xs"
              title="Impor Data Buku dari File CSV / Excel atau Salinan Teks"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">Impor CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGoogleSheetsModal(true)}
              className="w-full sm:w-auto px-2 sm:px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer border border-emerald-200 shadow-2xs"
              title="Hubungkan & Sinkronkan Data dari Link CSV Google Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Link Sheets</span>
              {googleSheetsUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Tersambung ke Google Sheets CSV" />
              )}
            </button>
          </div>
        </div>

        {/* Row 3: Filters Category & Condition */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 pt-2 border-t border-slate-100">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="Semua">Semua Kondisi</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="col-span-2 sm:col-span-1 sm:ml-auto text-[11px] text-slate-400 text-right font-medium self-center">
            Total: <span className="font-bold text-slate-700">{filteredBooks.length}</span> buku
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 0. TAMPILAN SPREADSHEET GRID (SEL-SEL EDITABLE SPREADSHEET)               */}
      {/* ========================================================================= */}
      {viewMode === 'spreadsheet' && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Spreadsheet Header Bar */}
          <div className="bg-slate-900 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddNewGridRow}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>

              <button
                type="button"
                onClick={() => exportBooksToCSVFile(filteredBooks)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Unduh CSV</span>
              </button>
            </div>
          </div>

          {/* Spreadsheet Grid Table */}
          <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs font-mono select-none">
              <thead className="sticky top-0 z-20 bg-slate-100 text-slate-600 border-b border-slate-300 font-bold">
                {/* Letter Header Row */}
                <tr className="bg-slate-200 text-[10px] text-slate-500 text-center">
                  <th className="p-1 border border-slate-300 w-10 bg-slate-300">fx</th>
                  <th className="p-1 border border-slate-300">A</th>
                  <th className="p-1 border border-slate-300">B</th>
                  <th className="p-1 border border-slate-300">C</th>
                  <th className="p-1 border border-slate-300">D</th>
                  <th className="p-1 border border-slate-300">E</th>
                  <th className="p-1 border border-slate-300">F</th>
                  <th className="p-1 border border-slate-300">G</th>
                  <th className="p-1 border border-slate-300">H</th>
                  <th className="p-1 border border-slate-300">I</th>
                  <th className="p-1 border border-slate-300">J</th>
                  <th className="p-1 border border-slate-300 w-12">Aksi</th>
                </tr>
                {/* Title Header Row */}
                <tr className="text-xs">
                  <th className="py-2 px-2 border border-slate-300 text-center bg-slate-200 w-10 text-slate-700 font-bold">#</th>
                  <th className="py-2 px-2 border border-slate-300 min-w-[130px]">Barcode</th>
                  <th className="py-2 px-2 border border-slate-300 min-w-[220px]">Judul Buku</th>
                  <th className="py-2 px-2 border border-slate-300 min-w-[150px]">Pengarang</th>
                  <th className="py-2 px-2 border border-slate-300 min-w-[150px]">Penerbit</th>
                  <th className="py-2 px-2 border border-slate-300 min-w-[150px]">Kategori</th>
                  <th className="py-2 px-2 border border-slate-300 w-24 text-center">Thn Terbit</th>
                  <th className="py-2 px-2 border border-slate-300 w-24 text-center">Thn Masuk</th>
                  <th className="py-2 px-2 border border-slate-300 w-20 text-center">Eksemplar</th>
                  <th className="py-2 px-2 border border-slate-300 min-w-[120px]">Lokasi Rak</th>
                  <th className="py-2 px-2 border border-slate-300 min-w-[130px]">Kondisi</th>
                  <th className="py-2 px-2 border border-slate-300 text-center w-12 bg-slate-200">Hapus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredBooks.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center text-slate-400 font-sans">
                      Belum ada data buku. Klik tombol "Tambah Baris" di atas untuk menambahkan buku.
                    </td>
                  </tr>
                ) : (
                  filteredBooks.map((book, idx) => (
                    <tr key={`grid-book-${book.id}`} className="hover:bg-indigo-50/20 transition-colors">
                      {/* Row Index */}
                      <td className="p-1 text-center font-bold text-slate-400 bg-slate-100 border border-slate-300 text-[11px] select-none">
                        {idx + 1}
                      </td>

                      {/* Barcode */}
                      <td className="p-0 border border-slate-300">
                        <input
                          type="text"
                          value={book.barcode}
                          onChange={(e) => updateBook(book.id, { barcode: e.target.value })}
                          placeholder="Barcode / ISBN..."
                          className="w-full h-full px-2 py-1.5 font-mono text-xs text-slate-800 placeholder:text-slate-300 placeholder:font-sans placeholder:italic bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </td>

                      {/* Judul Buku */}
                      <td className="p-0 border border-slate-300 font-sans font-medium">
                        <input
                          type="text"
                          value={book.title}
                          onChange={(e) => updateBook(book.id, { title: e.target.value })}
                          placeholder="Ketik judul buku..."
                          className="w-full h-full px-2 py-1.5 text-xs text-slate-900 font-bold placeholder:text-slate-300 placeholder:font-normal placeholder:italic bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </td>

                      {/* Pengarang */}
                      <td className="p-0 border border-slate-300 font-sans">
                        <input
                          type="text"
                          value={book.author}
                          onChange={(e) => updateBook(book.id, { author: e.target.value })}
                          placeholder="Ketik nama pengarang..."
                          className="w-full h-full px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-300 placeholder:italic bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </td>

                      {/* Penerbit */}
                      <td className="p-0 border border-slate-300 font-sans">
                        <input
                          type="text"
                          value={book.publisher}
                          onChange={(e) => updateBook(book.id, { publisher: e.target.value })}
                          placeholder="Ketik penerbit..."
                          className="w-full h-full px-2 py-1.5 text-xs text-slate-700 placeholder:text-slate-300 placeholder:italic bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </td>

                      {/* Kategori */}
                      <td className="p-0 border border-slate-300 font-sans">
                        <select
                          value={book.category}
                          onChange={(e) => updateBook(book.id, { category: e.target.value })}
                          className="w-full h-full px-2 py-1.5 text-xs text-slate-700 bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                        >
                          {CATEGORIES.filter((c) => c !== 'Semua Kategori').map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Tahun Terbit */}
                      <td className="p-0 border border-slate-300 text-center">
                        <input
                          type="number"
                          value={book.publishYear}
                          onChange={(e) => updateBook(book.id, { publishYear: Number(e.target.value) })}
                          className="w-full h-full px-1 py-1.5 text-center text-xs text-slate-700 bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </td>

                      {/* Tahun Masuk */}
                      <td className="p-0 border border-slate-300 text-center">
                        <input
                          type="number"
                          value={book.entryYear}
                          onChange={(e) => updateBook(book.id, { entryYear: Number(e.target.value) })}
                          className="w-full h-full px-1 py-1.5 text-center text-xs text-slate-700 bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </td>

                      {/* Total Copies */}
                      <td className="p-0 border border-slate-300 text-center font-bold">
                        <input
                          type="number"
                          value={book.totalCopies}
                          onChange={(e) => updateBook(book.id, { totalCopies: Math.max(1, Number(e.target.value)) })}
                          className="w-full h-full px-1 py-1.5 text-center text-xs text-indigo-700 font-bold bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </td>

                      {/* Lokasi Rak */}
                      <td className="p-0 border border-slate-300 font-sans">
                        <input
                          type="text"
                          value={book.shelfLocation || ''}
                          onChange={(e) => updateBook(book.id, { shelfLocation: e.target.value })}
                          className="w-full h-full px-2 py-1.5 text-xs text-slate-700 bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                          placeholder="Rak A1"
                        />
                      </td>

                      {/* Kondisi Fisik */}
                      <td className="p-0 border border-slate-300 font-sans">
                        <select
                          value={book.condition}
                          onChange={(e) => updateBook(book.id, { condition: e.target.value as BookCondition })}
                          className="w-full h-full px-2 py-1.5 text-xs text-slate-700 bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                        >
                          {CONDITIONS.map((cond) => (
                            <option key={cond} value={cond}>
                              {cond}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Delete Action */}
                      <td className="p-1 border border-slate-300 text-center bg-slate-50">
                        <button
                          type="button"
                          onClick={() => deleteBook(book.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                          title="Hapus Baris Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Spreadsheet Footer Bar */}
          <div className="bg-slate-100 px-4 py-2 border-t border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-mono">
            <div>
              Total Baris: <span className="font-bold text-slate-800">{filteredBooks.length}</span> | Terhubung: <span className="text-emerald-700 font-bold">Cloud Firestore</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddNewGridRow}
                className="text-indigo-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Baris Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. KHUSUS TAMPILAN HP (MOBILE ONLY: md:hidden)                            */}
      {/* Minimalis: Gambar (klik untuk detail), Judul Buku, Rak, dan Aksi          */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="md:hidden space-y-2.5">
        {filteredBooks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            Tidak ada buku yang sesuai dengan pencarian
          </div>
        ) : (
          filteredBooks.map((book) => (
            <div
              key={`mobile-book-${book.id}`}
              className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex items-center gap-3 transition-all"
            >
              {/* Gambar Sampul - Klik untuk melihat detail lengkap */}
              <button
                type="button"
                onClick={() => setDetailBook(book)}
                className="relative shrink-0 group focus:outline-none cursor-pointer"
                title="Tekan foto untuk melihat detail lengkap"
              >
                <img
                  src={book.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100'}
                  alt={book.title}
                  className="w-12 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs group-hover:opacity-90 group-active:scale-95 transition-all"
                />
                <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white transition-opacity">
                  <Eye className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Minimalis Info: Judul Buku & Rak */}
              <div className="flex-1 min-w-0 pr-1">
                <button
                  type="button"
                  onClick={() => setDetailBook(book)}
                  className="text-left w-full focus:outline-none cursor-pointer"
                >
                  <h4 className="font-extrabold text-xs text-slate-900 line-clamp-2 leading-snug hover:text-indigo-600 transition-colors">
                    {book.title}
                  </h4>
                </button>

                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate max-w-[120px]">{book.shelfLocation || 'Rak Belum Diset'}</span>
                  </span>

                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                      book.availableCopies > 0
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    Stok: {book.availableCopies}
                  </span>
                </div>
              </div>

              {/* Aksi */}
              <div className="flex items-center gap-1 shrink-0 pl-1 border-l border-slate-100">
                <button
                  type="button"
                  onClick={() => setBarcodePrintBook(book)}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                  title="Cetak Barcode"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(book)}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                  title="Ubah Buku"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteBook(book.id)}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Hapus Buku"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAMPILAN TABEL LENGKAP UNTUK DESKTOP (md:block)                        */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <th className="py-3 px-4 w-12">Sampul</th>
                <th className="py-3 px-4">Informasi Buku</th>
                <th className="py-3 px-4">Kategori & Rak</th>
                <th className="py-3 px-4">Tahun</th>
                <th className="py-3 px-4 text-center">Stok / Total</th>
                <th className="py-3 px-4 text-center">Kondisi Fisik</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada buku yang sesuai dengan pencarian
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/50">
                    {/* Cover */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setDetailBook(book)}
                        className="cursor-pointer group relative focus:outline-none"
                        title="Klik untuk melihat detail buku"
                      >
                        <img
                          src={book.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100'}
                          alt=""
                          className="w-10 h-14 object-cover rounded-lg border border-slate-200 shrink-0 group-hover:opacity-90"
                        />
                      </button>
                    </td>

                    {/* Title, Author, Publisher, Barcode */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 line-clamp-1">{book.title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {book.author} • {book.publisher}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>Barcode: {book.barcode}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-md text-[11px]">
                        {book.category}
                      </span>
                      {book.shelfLocation && (
                        <div className="text-[10px] text-slate-400 mt-1">{book.shelfLocation}</div>
                      )}
                    </td>

                    {/* Years */}
                    <td className="py-3 px-4 text-slate-600">
                      <div>Terbit: {book.publishYear}</div>
                      <div className="text-[10px] text-slate-400">Masuk: {book.entryYear}</div>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block font-bold text-xs px-2 py-0.5 rounded-lg border ${
                          book.availableCopies > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {book.availableCopies} / {book.totalCopies}
                      </span>
                    </td>

                    {/* Condition */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getConditionBadge(
                          book.condition
                        )}`}
                      >
                        {book.condition}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setBarcodePrintBook(book)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Cetak Barcode"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(book)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Ubah"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteBook(book.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Tombol Simpan di Paling Bawah */}
      <div className="pt-3 pb-6 flex items-center justify-end">
        <button
          type="button"
          onClick={handleSyncBooks}
          disabled={isSavingToFirebase}
          className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          title="Simpan seluruh data buku ke Firebase"
        >
          {isSavingToFirebase ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UploadCloud className="w-4 h-4" />
          )}
          <span>Simpan</span>
        </button>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base font-heading">
                {editingBook ? 'Ubah Data Buku' : 'Tambah Buku Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Barcode */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barcode / ISBN</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Contoh: 9786022443011"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'Semua Kategori').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Judul Buku */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Judul Buku</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Masukkan judul buku lengkap"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Pengarang */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pengarang</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Nama penulis/penyusun"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Penerbit */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Penerbit</label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                    placeholder="Nama penerbit"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Tahun Terbit */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    value={formData.publishYear}
                    onChange={(e) => setFormData({ ...formData, publishYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Tahun Masuk */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tahun Masuk</label>
                  <input
                    type="number"
                    value={formData.entryYear}
                    onChange={(e) => setFormData({ ...formData, entryYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Total Eksemplar */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Eksemplar</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.totalCopies}
                    onChange={(e) => setFormData({ ...formData, totalCopies: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Kondisi Fisik */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kondisi Fisik</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as BookCondition })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lokasi Rak */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lokasi Rak</label>
                  <input
                    type="text"
                    value={formData.shelfLocation}
                    onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                    placeholder="Contoh: Rak B2 - Sastra"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Sampul Buku (Foto Langsung / Unggah / URL) */}
              <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-xs text-slate-800">
                    Sampul Buku (Foto Langsung / Unggah)
                  </label>
                  {formData.coverUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, coverUrl: '' })}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  {/* Thumbnail / Placeholder */}
                  <div className="shrink-0 relative">
                    {formData.coverUrl ? (
                      <img
                        src={formData.coverUrl}
                        alt="Sampul Buku"
                        className="w-16 h-22 object-cover rounded-xl border border-indigo-200 shadow-xs bg-white"
                      />
                    ) : (
                      <div className="w-16 h-22 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-white">
                        <ImageIcon className="w-6 h-6 stroke-1" />
                        <span className="text-[9px] mt-1 font-medium">Tanpa Foto</span>
                      </div>
                    )}
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-[8px] font-bold mt-1">Drive...</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Foto Langsung, Kamera HP, Unggah Berkas */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Tombol Foto Langsung (Buka Viewfinder Kamera) */}
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => setIsCameraModalOpen(true)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                        title="Buka kamera untuk foto sampul buku langsung"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Foto Langsung</span>
                      </button>

                      {/* Tombol Kamera Bawaan HP (capture="environment") */}
                      <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-colors text-xs font-bold shadow-2xs ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Kamera HP</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          disabled={isUploadingImage}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>

                      {/* Tombol Pilih dari Galeri / Berkas */}
                      <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors text-xs font-semibold shadow-2xs ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Galeri / Berkas</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingImage}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Status Google Drive / Tautan URL */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Tautan Gambar / Google Drive</span>
                        {formData.coverUrl && (formData.coverUrl.includes('googleusercontent.com') || formData.coverUrl.includes('drive.google.com')) && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                            <HardDrive className="w-3 h-3" />
                            Tersimpan di Google Drive
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.coverUrl}
                        onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                        placeholder="Atau tempel URL gambar / Google Drive..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Print Modal */}
      {barcodePrintBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4">
            <h3 className="font-bold text-slate-900 text-base font-heading">Label Barcode Buku</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
              <div className="text-[11px] font-bold text-slate-800 line-clamp-1 mb-1">{barcodePrintBook.title}</div>
              <div className="text-[10px] text-slate-500 mb-2">{barcodePrintBook.shelfLocation || 'Perpustakaan Bunga Tanjung'}</div>
              <BarcodeDisplay value={barcodePrintBook.barcode} height={40} width={1.5} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Label</span>
              </button>
              <button
                onClick={() => setBarcodePrintBook(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Detail Buku Modal (Muncul saat menekan gambar sampul) */}
      {detailBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base font-heading">
                    Detail Informasi Buku
                  </h3>
                  <p className="text-[11px] text-slate-400">Barcode: {detailBook.barcode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailBook(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: Cover & Core Details */}
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
              <img
                src={detailBook.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=100'}
                alt={detailBook.title}
                className="w-28 h-40 sm:w-32 sm:h-44 object-cover rounded-xl border border-slate-200 shadow-md shrink-0"
              />

              <div className="flex-1 space-y-2 w-full text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {detailBook.category}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                    {detailBook.title}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Penulis</span>
                    <span className="font-semibold text-slate-800">{detailBook.author || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Penerbit</span>
                    <span className="font-semibold text-slate-800">{detailBook.publisher || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lokasi Rak</span>
                    <span className="font-semibold text-indigo-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {detailBook.shelfLocation || 'Belum diatur'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Kondisi Fisik</span>
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded-md border ${getConditionBadge(
                        detailBook.condition
                      )}`}
                    >
                      {detailBook.condition}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tahun Terbit / Masuk</span>
                    <span className="font-medium text-slate-700">
                      {detailBook.publishYear} / {detailBook.entryYear}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Stok Tersedia</span>
                    <span className="font-bold text-emerald-600">
                      {detailBook.availableCopies} dari {detailBook.totalCopies} buku
                    </span>
                  </div>
                </div>

                {/* Barcode display */}
                <div className="pt-2 flex flex-col items-center sm:items-start">
                  <span className="text-[10px] text-slate-400 mb-1">Pratinjau Barcode:</span>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <BarcodeDisplay value={detailBook.barcode} height={32} width={1.2} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sinopsis jika ada */}
            {detailBook.synopsis && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block mb-1">Sinopsis / Ringkasan</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {detailBook.synopsis}
                </p>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const b = detailBook;
                  setDetailBook(null);
                  setBarcodePrintBook(b);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Barcode</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const b = detailBook;
                  setDetailBook(null);
                  openEditModal(b);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah Data</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailBook(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Photo Modal (Langsung Foto Sampul Buku) */}
      <CameraPhotoModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(dataUrl) => {
          processAndUploadCover(dataUrl);
        }}
        title="Ambil Foto Sampul Buku"
      />

      {/* ========================================================================= */}
      {/* MODAL IMPOR DATA BUKU (CSV / EXCEL / PASTE)                                */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Impor Arsip Buku (CSV / Excel)</h3>
                  <p className="text-[11px] text-slate-500">Unggah file CSV atau salin sel dari Excel/Google Sheets.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Download Prompt */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-indigo-900 block">Belum Punya Format CSV?</span>
                  <span className="text-indigo-700 text-[11px]">Unduh template standar katalog buku yang sudah terformat rapi.</span>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadBookTemplateCSV}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition shadow-xs text-[11px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template</span>
              </button>
            </div>

            {/* Source Selector Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setImportSource('file')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                  importSource === 'file'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah File CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setImportSource('text')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                  importSource === 'text'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin-Tempel Teks (Spreadsheet / CSV)</span>
              </button>
            </div>

            {/* File Upload Input */}
            {importSource === 'file' ? (
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-indigo-500 transition bg-slate-50/50">
                <UploadCloud className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">Pilih file .CSV atau .TXT dari perangkat</p>
                <p className="text-[11px] text-slate-400 mt-1 mb-3">Format kolom disarankan: Barcode, Judul Buku, Pengarang, Penerbit, Kategori, Tahun Terbit, Tahun Masuk, Eksemplar, Kondisi, Rak</p>
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUploadCSV}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>
            ) : (
              /* Raw Text Area */
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Tempel Data CSV / Sel Spreadsheet</label>
                <textarea
                  rows={6}
                  value={rawImportText}
                  onChange={(e) => handleParseImportCSVText(e.target.value)}
                  placeholder="Barcode,Judul Buku,Pengarang,Penerbit,Kategori,Tahun Terbit,Tahun Masuk,Jumlah,Kondisi,Rak&#10;9786020332116,Laskar Pelangi,Andrea Hirata,Bentang Pustaka,Novel & Sastra,2005,2023,10,Sangat Baik,Rak A1"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            )}

            {/* Preview Table of Parsed Rows */}
            {parsedImportRows.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Pratinjau Hasil Pembacaan Data:</span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md border border-emerald-200">
                      {parsedImportRows.filter((r) => r.isValid).length} Valid
                    </span>
                    {parsedImportRows.filter((r) => r.isExisting).length > 0 && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded-md border border-amber-200">
                        {parsedImportRows.filter((r) => r.isExisting).length} Perbarui
                      </span>
                    )}
                    {parsedImportRows.filter((r) => !r.isValid).length > 0 && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded-md border border-rose-200">
                        {parsedImportRows.filter((r) => !r.isValid).length} Tidak Valid
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                      <tr>
                        <th className="p-2 border-b border-slate-200">#</th>
                        <th className="p-2 border-b border-slate-200">Barcode</th>
                        <th className="p-2 border-b border-slate-200">Judul Buku</th>
                        <th className="p-2 border-b border-slate-200">Pengarang</th>
                        <th className="p-2 border-b border-slate-200">Kategori</th>
                        <th className="p-2 border-b border-slate-200 text-center">Stok</th>
                        <th className="p-2 border-b border-slate-200">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedImportRows.slice(0, 15).map((row, index) => (
                        <tr key={`import-row-${index}`} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-slate-400">{index + 1}</td>
                          <td className="p-2 font-mono text-slate-700">{row.barcode}</td>
                          <td className="p-2 font-bold text-slate-900">{row.title}</td>
                          <td className="p-2 text-slate-600">{row.author}</td>
                          <td className="p-2 text-slate-600">{row.category}</td>
                          <td className="p-2 text-center font-bold text-indigo-600">{row.totalCopies}</td>
                          <td className="p-2">
                            {row.isValid ? (
                              row.isExisting ? (
                                <span className="text-[10px] text-amber-700 font-bold">Perbarui</span>
                              ) : (
                                <span className="text-[10px] text-emerald-700 font-bold">Buku Baru</span>
                              )
                            ) : (
                              <span className="text-[10px] text-rose-600 font-bold">{row.validationError || 'Gagal'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedImportRows.length > 15 && (
                  <p className="text-[10px] text-slate-400 text-right">
                    ...menampilkan 15 dari total {parsedImportRows.length} baris
                  </p>
                )}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={parsedImportRows.filter((r) => r.isValid).length === 0}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Impor {parsedImportRows.filter((r) => r.isValid).length} Buku Valid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LINK SINKRONISASI GOOGLE SPREADSHEET                                */}
      {/* ========================================================================= */}
      {showGoogleSheetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Hubungkan Google Spreadsheet</h3>
                  <p className="text-[11px] text-slate-500">Edit data buku langsung dari Google Sheets & sinkronkan 1-klik.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleSheetsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Steps */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <span className="font-bold text-slate-800 block flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cara Menggunakan Google Spreadsheet CSV Live Sync:</span>
              </span>
              <ol className="list-decimal list-inside text-slate-600 text-[11px] space-y-1 pl-1">
                <li>Buka file Katalog Buku Anda di Google Sheets (atau unduh template standar kami).</li>
                <li>Pilih menu <strong>File</strong> &rarr; <strong>Bagikan</strong> &rarr; <strong>Publikasikan ke Web</strong>.</li>
                <li>Pada bagian pilihan format, pilih <strong>Nilai yang Dipisahkan Koma (.csv)</strong>.</li>
                <li>Klik tombol <strong>Publikasikan</strong>, lalu salin tautan URL yang dihasilkan.</li>
                <li>Tempel tautan tersebut pada kolom di bawah ini dan klik <strong>Sinkronkan Sekarang</strong>.</li>
              </ol>
            </div>

            {/* URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block flex items-center justify-between">
                <span>Tautan CSV Publikasi Google Sheets:</span>
                <button
                  type="button"
                  onClick={() => window.open('https://docs.google.com/spreadsheets/u/0/create', '_blank')}
                  className="text-emerald-600 hover:underline text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka Google Sheets Baru</span>
                </button>
              </label>
              <div className="relative">
                <Link className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={googleSheetsUrl}
                  onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-800"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={downloadBookTemplateCSV}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl flex items-center gap-1.5 cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template Buku (.csv)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleSheetsModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleSyncGoogleSheetsCSV()}
                  disabled={isSyncingSheets || !googleSheetsUrl.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {isSyncingSheets ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyinkronkan...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Sinkronkan Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
