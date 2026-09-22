/**
 * Layanan Integrasi Google Apps Script untuk Google Drive & Google Sheets
 * Sistem Perpustakaan Digital "Bunga Tanjung" - SMP Negeri 1 Bengkalis
 */

export const APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: JEMBATAN GOOGLE DRIVE & GOOGLE SHEETS
 * PERPUSTAKAAN BUNGA TANJUNG - SMP NEGERI 1 BENGKALIS
 * =========================================================================
 * 
 * PANDUAN PENERAPAN (DEPLOYMENT):
 * 1. Buka https://script.google.com di akun Google Anda.
 * 2. Klik "Proyek Baru" (New Project), lalu tempel seluruh isi kode ini ke Code.gs.
 * 3. Klik tombol "Terapkan" (Deploy) -> "Penerapan Baru" (New deployment).
 * 4. Pilih jenis: "Aplikasi Web" (Web App).
 * 5. Konfigurasi:
 *    - Deskripsi: Jembatan Drive Bunga Tanjung
 *    - Jalankan sebagai (Execute as): "Saya" (Me)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone)
 * 6. Klik "Terapkan", berikan otorisasi izin Drive & Sheets jika diminta.
 * 7. Salin URL Aplikasi Web (berakhiran /exec) dan tempel di Panel Sinkronisasi Aplikasi.
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    app: 'Sistem Perpustakaan Digital Bunga Tanjung',
    service: 'Google Drive & Sheets API Bridge',
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var raw = e.postData ? e.postData.contents : '';
    if (!raw) {
      return responseJSON({ success: false, error: 'Request body kosong' });
    }

    var body = JSON.parse(raw);
    var action = body.action;

    // -------------------------------------------------------------
    // 1. UJI SAMBUNGAN (PING)
    // -------------------------------------------------------------
    if (action === 'ping') {
      return responseJSON({
        success: true,
        message: 'Google Apps Script terhubung dengan sukses!',
        activeUser: Session.getActiveUser().getEmail() || 'Akun Google Terotorisasi',
        timestamp: new Date().toISOString()
      });
    }

    // -------------------------------------------------------------
    // 2. UNGGAH GAMBAR (COVER BUKU, FOTO SISWA, LOGO) KE GOOGLE DRIVE
    // -------------------------------------------------------------
    if (action === 'uploadImage' || action === 'uploadLogo') {
      var base64Data = body.base64Data;
      if (!base64Data) {
        return responseJSON({ success: false, error: 'Data gambar base64 tidak ditemukan' });
      }

      // Bersihkan prefix data URL jika ada
      if (base64Data.indexOf(';base64,') !== -1) {
        base64Data = base64Data.split(';base64,')[1];
      }

      var category = body.category || (action === 'uploadLogo' ? 'logos' : 'general');
      var prefix = category === 'covers' ? 'cover-' : (category === 'students' ? 'siswa-' : (category === 'logos' ? 'logo-' : 'img-'));
      var fileName = body.fileName || (prefix + new Date().getTime() + '.jpg');
      var mimeType = body.mimeType || 'image/jpeg';
      var customFolderId = body.folderId;

      var decoded = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decoded, mimeType, fileName);

      // Cari atau buat Root Folder
      var rootFolder;
      if (customFolderId && customFolderId.trim() !== '') {
        try {
          rootFolder = DriveApp.getFolderById(customFolderId.trim());
        } catch (fErr) {
          rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), 'Perpustakaan Bunga Tanjung - SMPN 1 Bengkalis');
        }
      } else {
        rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), 'Perpustakaan Bunga Tanjung - SMPN 1 Bengkalis');
      }

      // Subfolder terstruktur otomatis
      var subFolderName = 'Lainnya';
      if (category === 'covers') subFolderName = 'Sampul Buku';
      else if (category === 'students') subFolderName = 'Foto Siswa';
      else if (category === 'logos') subFolderName = 'Logo & Branding';

      var targetFolder = getOrCreateFolder(rootFolder, subFolderName);
      var file = targetFolder.createFile(blob);

      // Berikan akses publik agar gambar dapat langsung ditampilkan di browser
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      var fileId = file.getId();
      // Direct CDN URL Google yang super cepat untuk tag <img>
      var directUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
      var webViewLink = file.getUrl();

      return responseJSON({
        success: true,
        fileId: fileId,
        fileUrl: directUrl,
        webViewLink: webViewLink,
        fileName: file.getName(),
        folderName: targetFolder.getName(),
        category: category
      });
    }

    // -------------------------------------------------------------
    // 3. BATCH UNGGAH GAMBAR (MIGRASI MASSAL KE DRIVE)
    // -------------------------------------------------------------
    if (action === 'batchUploadImages') {
      var items = body.items || []; // Array of { id, base64Data, fileName, mimeType, category }
      if (!items || items.length === 0) {
        return responseJSON({ success: false, error: 'Daftar item gambar kosong' });
      }

      var customFolderId = body.folderId;
      var rootFolder;
      if (customFolderId && customFolderId.trim() !== '') {
        try {
          rootFolder = DriveApp.getFolderById(customFolderId.trim());
        } catch (fErr) {
          rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), 'Perpustakaan Bunga Tanjung - SMPN 1 Bengkalis');
        }
      } else {
        rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), 'Perpustakaan Bunga Tanjung - SMPN 1 Bengkalis');
      }

      var folderCovers = getOrCreateFolder(rootFolder, 'Sampul Buku');
      var folderStudents = getOrCreateFolder(rootFolder, 'Foto Siswa');
      var folderLogos = getOrCreateFolder(rootFolder, 'Logo & Branding');
      var folderGeneral = getOrCreateFolder(rootFolder, 'Lainnya');

      var results = [];

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        try {
          var b64 = item.base64Data;
          if (!b64) continue;
          if (b64.indexOf(';base64,') !== -1) {
            b64 = b64.split(';base64,')[1];
          }

          var decoded = Utilities.base64Decode(b64);
          var mType = item.mimeType || 'image/jpeg';
          var fName = item.fileName || ('item-' + (item.id || i) + '.jpg');
          var blob = Utilities.newBlob(decoded, mType, fName);

          var target = folderGeneral;
          if (item.category === 'covers') target = folderCovers;
          else if (item.category === 'students') target = folderStudents;
          else if (item.category === 'logos') target = folderLogos;

          var f = target.createFile(blob);
          f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          var fid = f.getId();

          results.push({
            id: item.id,
            success: true,
            fileId: fid,
            fileUrl: 'https://lh3.googleusercontent.com/d/' + fid,
            category: item.category
          });
        } catch (itemErr) {
          results.push({
            id: item.id,
            success: false,
            error: itemErr.toString()
          });
        }
      }

      return responseJSON({
        success: true,
        processedCount: results.length,
        results: results
      });
    }

    // -------------------------------------------------------------
    // 4. SINKRONISASI DATA KE GOOGLE SHEETS
    // -------------------------------------------------------------
    if (action === 'syncData') {
      var payload = body.data || {};
      var ssName = 'Data Perpustakaan Bunga Tanjung - SMPN 1 Bengkalis';
      var files = DriveApp.getFilesByName(ssName);
      var ss;
      if (files.hasNext()) {
        ss = SpreadsheetApp.open(files.next());
      } else {
        ss = SpreadsheetApp.create(ssName);
      }

      // Sheet 1: Katalog Buku
      if (payload.books && payload.books.length > 0) {
        var sheetBuku = getOrCreateSheet(ss, 'Katalog Buku');
        sheetBuku.clear();
        sheetBuku.appendRow(['Barcode', 'Judul Buku', 'Pengarang', 'Penerbit', 'Kategori', 'Tahun Terbit', 'Tahun Masuk', 'Total Stok', 'Stok Tersedia', 'Kondisi', 'URL Sampul Drive']);
        payload.books.forEach(function(b) {
          sheetBuku.appendRow([b.barcode, b.title, b.author, b.publisher, b.category, b.publishYear, b.entryYear, b.totalCopies, b.availableCopies, b.condition, b.coverUrl || '']);
        });
        sheetBuku.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#e0e7ff');
        sheetBuku.autoResizeColumns(1, 11);
      }

      // Sheet 2: Anggota Siswa
      if (payload.students && payload.students.length > 0) {
        var sheetSiswa = getOrCreateSheet(ss, 'Anggota Siswa');
        sheetSiswa.clear();
        sheetSiswa.appendRow(['ID Anggota', 'NISN', 'Nama Siswa', 'Kelas', 'Total Kunjungan', 'Pinjaman Aktif', 'URL Foto Drive']);
        payload.students.forEach(function(s) {
          sheetSiswa.appendRow([s.id, s.nisn, s.name, s.classGrade, s.visitCount, s.activeLoanCount, s.photoUrl || '']);
        });
        sheetSiswa.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#e0e7ff');
        sheetSiswa.autoResizeColumns(1, 7);
      }

      // Sheet 3: Riwayat Transaksi
      if (payload.transactions && payload.transactions.length > 0) {
        var sheetTrx = getOrCreateSheet(ss, 'Sirkulasi Peminjaman');
        sheetTrx.clear();
        sheetTrx.appendRow(['ID Transaksi', 'Judul Buku', 'Barcode', 'Nama Siswa', 'Kelas', 'Tgl Pinjam', 'Jatuh Tempo', 'Tgl Kembali', 'Status']);
        payload.transactions.forEach(function(t) {
          sheetTrx.appendRow([t.id, t.bookTitle, t.bookBarcode, t.studentName, t.studentClass, t.borrowDate, t.dueDate, t.returnDate || '-', t.status]);
        });
        sheetTrx.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#e0e7ff');
        sheetTrx.autoResizeColumns(1, 9);
      }

      return responseJSON({
        success: true,
        message: 'Sinkronisasi ke Google Sheets berhasil',
        spreadsheetUrl: ss.getUrl(),
        lastSync: new Date().toISOString()
      });
    }

    return responseJSON({ success: false, error: 'Aksi tidak dikenali: ' + action });
  } catch (err) {
    return responseJSON({ success: false, error: err.toString() });
  }
}

function getOrCreateFolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Menguji koneksi ke Google Apps Script Web App
 */
export async function testAppsScriptConnection(url: string): Promise<{ success: boolean; message: string; data?: any }> {
  if (!url || !url.startsWith('https://script.google.com/')) {
    return { success: false, message: 'URL harus berupa tautan Web App Google Apps Script (https://script.google.com/.../exec)' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action: 'ping' }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.success) {
      return { success: true, message: data.message || 'Koneksi berhasil', data };
    } else {
      return { success: false, message: data.error || 'Respon error dari Apps Script' };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi Apps Script: ${err.message || 'Pastikan deploy web app diatur "Who has access: Anyone"'}`,
    };
  }
}

/**
 * Mengunggah gambar (Cover Buku, Foto Siswa, Logo) ke Google Drive melalui Google Apps Script
 */
export async function uploadImageToDrive(
  url: string,
  base64Data: string,
  fileName: string,
  mimeType: string = 'image/jpeg',
  category: 'covers' | 'students' | 'logos' | 'general' = 'general',
  folderId?: string
): Promise<{ success: boolean; fileUrl?: string; fileId?: string; folderName?: string; error?: string }> {
  if (!url || !url.startsWith('https://script.google.com/')) {
    return { success: false, error: 'URL Google Apps Script belum dikonfigurasi' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'uploadImage',
        base64Data,
        fileName,
        mimeType,
        category,
        folderId: folderId || '',
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.success && data.fileUrl) {
      return {
        success: true,
        fileUrl: data.fileUrl,
        fileId: data.fileId,
        folderName: data.folderName,
      };
    } else {
      return { success: false, error: data.error || 'Gagal mengunggah gambar ke Google Drive' };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Koneksi Apps Script gagal: ${err.message || 'Periksa izin deploy Web App'}`,
    };
  }
}

/**
 * Mengunggah file logo ke Google Drive melalui Google Apps Script
 */
export async function uploadLogoToDrive(
  url: string,
  base64Data: string,
  fileName: string,
  mimeType: string,
  folderId?: string
): Promise<{ success: boolean; fileUrl?: string; webViewLink?: string; error?: string }> {
  const result = await uploadImageToDrive(url, base64Data, fileName, mimeType, 'logos', folderId);
  return {
    success: result.success,
    fileUrl: result.fileUrl,
    error: result.error,
  };
}

/**
 * Batch upload gambar ke Google Drive untuk migrasi data Base64
 */
export async function batchUploadImagesToDrive(
  url: string,
  items: Array<{
    id: string;
    base64Data: string;
    fileName: string;
    mimeType?: string;
    category: 'covers' | 'students' | 'logos' | 'general';
  }>,
  folderId?: string
): Promise<{ success: boolean; processedCount?: number; results?: any[]; error?: string }> {
  if (!url || !url.startsWith('https://script.google.com/')) {
    return { success: false, error: 'URL Google Apps Script belum dikonfigurasi' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'batchUploadImages',
        items,
        folderId: folderId || '',
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Koneksi ke Apps Script terputus' };
  }
}

/**
 * Sinkronisasi seluruh koleksi data perpustakaan ke Google Sheets
 */
export async function syncDataToGoogleSheets(
  url: string,
  payload: { books: any[]; students: any[]; transactions: any[]; visits: any[] }
): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> {
  if (!url || !url.startsWith('https://script.google.com/')) {
    return { success: false, error: 'URL Google Apps Script belum diatur' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'syncData',
        data: payload,
      }),
    });

    const data = await res.json();
    if (data.success) {
      return {
        success: true,
        spreadsheetUrl: data.spreadsheetUrl,
      };
    } else {
      return { success: false, error: data.error || 'Gagal sinkronisasi data' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Koneksi ke Apps Script terputus' };
  }
}
