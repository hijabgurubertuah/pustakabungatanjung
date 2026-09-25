import React, { useState, useEffect, useRef } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Student } from '../../types';
import { SMPN1Logo } from '../common/SMPN1Logo';
import JsBarcode from 'jsbarcode';
import {
  IdCard,
  Printer,
  CheckSquare,
  Square,
  Search,
  Sparkles,
  LayoutGrid,
  Sliders,
  Upload,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  PenTool,
  Palette,
  Eye,
  RotateCcw,
} from 'lucide-react';

export type CardTemplateType = 'modern-navy' | 'classic-prestige' | 'clean-tech' | 'custom-background';

interface BuatKartuProps {
  onBackToMembers?: () => void;
}

// -----------------------------------------------------------------------------
// INTERNAL SVG BARCODE RENDERER (Self-contained, No QR)
// -----------------------------------------------------------------------------
const CardBarcode: React.FC<{
  value: string;
  height?: number;
  width?: number;
  lineColor?: string;
}> = ({ value, height = 18, width = 1.15, lineColor = '#1A1A2E' }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          height,
          width,
          displayValue: true,
          fontSize: 8.5,
          textMargin: 1,
          margin: 0,
          background: 'transparent',
          lineColor: lineColor || '#1A1A2E',
        });
      } catch {
        try {
          JsBarcode(svgRef.current, value, {
            format: 'CODE39',
            height,
            width: 1.0,
            displayValue: true,
            fontSize: 8,
            margin: 0,
            background: 'transparent',
            lineColor: lineColor || '#1A1A2E',
          });
        } catch (err) {
          console.warn('Barcode fail:', err);
        }
      }
    }
  }, [value, height, width, lineColor]);

  return <svg ref={svgRef} className="max-w-full h-auto mx-auto" />;
};

// -----------------------------------------------------------------------------
// MAIN COMPONENT: BuatKartu.tsx
// -----------------------------------------------------------------------------
export const BuatKartu: React.FC<BuatKartuProps> = ({ onBackToMembers }) => {
  const { students, logoUrl } = useLibrary();

  // Selection & Filtering
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'class' | 'nisn'>('class');

  // Customization & Templates
  const [template, setTemplate] = useState<CardTemplateType>('modern-navy');
  const [showFoldLines, setShowFoldLines] = useState<boolean>(true);
  const [customValidity, setCustomValidity] = useState<string>('Selama Menjadi Siswa Aktif');
  const [customHeadName, setCustomHeadName] = useState<string>('Dra. Hj. Nur Asyiah, M.Pd');
  const [customHeadNip, setCustomHeadNip] = useState<string>('NIP. 19680512 199403 2 004');

  // Signature PNG State
  const [headSignatureUrl, setHeadSignatureUrl] = useState<string | null>(null);
  const sigFileInputRef = useRef<HTMLInputElement | null>(null);

  // Custom Background Images (Front & Back)
  const [customBgFront, setCustomBgFront] = useState<string | null>(null);
  const [customBgBack, setCustomBgBack] = useState<string | null>(null);
  const bgFrontInputRef = useRef<HTMLInputElement | null>(null);
  const bgBackInputRef = useRef<HTMLInputElement | null>(null);

  // Text Color Customizer
  const [textColor, setTextColor] = useState<string>('#1A1A2E');
  const [headingColor, setHeadingColor] = useState<string>('#1E3A5F');
  const [accentColor, setAccentColor] = useState<string>('#F5A623');
  const [showSchoolLogoOnCustom, setShowSchoolLogoOnCustom] = useState<boolean>(true);

  // Extract distinct classes
  const classesList = ['Semua Kelas', ...Array.from(new Set(students.map((s) => s.classGrade))).sort()];

  // Filtered & Sorted Student List
  const filteredStudents = students
    .filter((s) => {
      const matchClass = selectedClass === 'Semua Kelas' || s.classGrade === selectedClass;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.classGrade.toLowerCase().includes(q);
      return matchClass && matchQuery;
    })
    .sort((a, b) => {
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
      if (sortOrder === 'nisn') return a.nisn.localeCompare(b.nisn);
      return a.classGrade.localeCompare(b.classGrade) || a.name.localeCompare(b.name);
    });

  // Default selection: select initial batch on mount
  useEffect(() => {
    if (selectedIds.length === 0 && students.length > 0) {
      setSelectedIds(students.slice(0, 10).map((s) => s.id));
    }
  }, [students]);

  // Selected student objects
  const printableStudents = students.filter((s) => selectedIds.includes(s.id));

  // Selection handlers
  const handleSelectAll = () => {
    setSelectedIds(filteredStudents.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleToggleStudent = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Signature File Upload Handler
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setHeadSignatureUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom Background Upload Handlers
  const handleBgFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomBgFront(event.target?.result as string);
        setTemplate('custom-background');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBgBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomBgBack(event.target?.result as string);
        setTemplate('custom-background');
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset Color Palettes
  const applyTextColorPreset = (mode: 'dark' | 'light' | 'gold' | 'navy') => {
    if (mode === 'dark') {
      setTextColor('#1A1A2E');
      setHeadingColor('#1E3A5F');
      setAccentColor('#F5A623');
    } else if (mode === 'light') {
      setTextColor('#FFFFFF');
      setHeadingColor('#F5A623');
      setAccentColor('#FFFFFF');
    } else if (mode === 'gold') {
      setTextColor('#FFF8E7');
      setHeadingColor('#F5A623');
      setAccentColor('#FFD166');
    } else if (mode === 'navy') {
      setTextColor('#1E3A5F');
      setHeadingColor('#0F172A');
      setAccentColor('#F5A623');
    }
  };

  // Trigger Native PDF Print
  const handlePrint = () => {
    if (printableStudents.length === 0) return;
    window.print();
  };

  // ---------------------------------------------------------------------------
  // CARD RENDERERS (Sisi Depan & Sisi Belakang - Tanpa QR Code)
  // ---------------------------------------------------------------------------

  // --- TEMPLATE 1: MODERN NAVY & GOLD (No QR) ---
  const renderModernNavyFront = (student: Student) => (
    <div
      className="w-[85.6mm] h-[54mm] bg-white relative overflow-hidden flex flex-col justify-between select-none box-border shadow-xs print:shadow-none"
      style={{
        width: '85.6mm',
        height: '54mm',
        minWidth: '85.6mm',
        minHeight: '54mm',
        maxWidth: '85.6mm',
        maxHeight: '54mm',
      }}
    >
      {/* Watermark */}
      <div className="absolute right-[-10mm] bottom-[-10mm] w-[40mm] h-[40mm] opacity-[0.04] pointer-events-none">
        <SMPN1Logo customUrl={logoUrl} className="w-full h-full" />
      </div>

      {/* Top Header Ribbon */}
      <div className="bg-[#1E3A5F] text-white px-3 py-1.5 flex items-center justify-between border-b-2 border-[#F5A623] relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-7 bg-white rounded p-0.5 shrink-0 flex items-center justify-center shadow-2xs">
            <SMPN1Logo customUrl={logoUrl} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-[9.5px] font-bold tracking-tight font-heading leading-tight text-white uppercase">
              SMP NEGERI 1 BENGKALIS
            </h1>
            <div className="text-[7.5px] font-semibold text-[#F5A623] tracking-wider uppercase leading-tight">
              PERPUSTAKAAN BUNGA TANJUNG
            </div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-[#F5A623] text-[#1A1A2E] text-[7.5px] font-extrabold tracking-wider uppercase shrink-0 shadow-2xs">
          KARTU ANGGOTA
        </span>
      </div>

      {/* Center Body: Student Photo & Metadata */}
      <div className="px-3 py-1.5 flex items-center gap-3 flex-1 relative z-10">
        {/* Photo 3x4 with Gold Frame */}
        <div className="w-[21mm] h-[28mm] rounded border-2 border-[#F5A623] overflow-hidden shrink-0 bg-[#F5F7FA] shadow-2xs relative">
          <img
            src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={student.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Metadata Details */}
        <div className="flex-1 min-w-0 space-y-0.5 text-left">
          <div
            className="font-bold text-[11px] leading-tight font-heading truncate pb-0.5"
            style={{ color: headingColor }}
          >
            {student.name}
          </div>

          <div
            className="grid grid-cols-[42px_1fr] text-[8.5px] leading-snug pt-0.5"
            style={{ color: textColor }}
          >
            <span className="opacity-75 font-medium">NISN</span>
            <span className="font-bold font-mono">: {student.nisn || '-'}</span>

            <span className="opacity-75 font-medium">Kelas</span>
            <span className="font-bold" style={{ color: headingColor }}>: {student.classGrade}</span>

            <span className="opacity-75 font-medium">ID Kartu</span>
            <span className="font-bold font-mono" style={{ color: headingColor }}>: {student.id}</span>

            <span className="opacity-75 font-medium">Berlaku</span>
            <span className="font-medium">: {customValidity}</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Barcode (Clean without QR) */}
      <div className="bg-[#F5F7FA] border-t border-[#E2E8F0] px-3 py-0.5 flex items-center justify-center relative z-10">
        <div className="w-full flex justify-center scale-95 -my-0.5">
          <CardBarcode value={student.id} height={14} width={1.2} lineColor="#1A1A2E" />
        </div>
      </div>
    </div>
  );

  const renderModernNavyBack = (student: Student) => (
    <div
      className="w-[85.6mm] h-[54mm] bg-white relative overflow-hidden flex flex-col justify-between select-none box-border shadow-xs print:shadow-none"
      style={{
        width: '85.6mm',
        height: '54mm',
        minWidth: '85.6mm',
        minHeight: '54mm',
        maxWidth: '85.6mm',
        maxHeight: '54mm',
      }}
    >
      {/* Top Header */}
      <div className="bg-[#1E3A5F] text-white px-2.5 py-1 text-center border-b-2 border-[#F5A623]">
        <h2 className="text-[8.5px] font-bold tracking-wider uppercase font-heading text-white">
          TATA TERTIB ANGGOTA PERPUSTAKAAN
        </h2>
      </div>

      {/* Rules Bullet Points */}
      <div
        className="px-3.5 py-1 flex-1 text-[7.5px] leading-tight space-y-0.5 text-left"
        style={{ color: textColor }}
      >
        <div className="flex items-start gap-1">
          <span className="font-bold" style={{ color: headingColor }}>1.</span>
          <span>Kartu wajib dibawa saat meminjam buku & presensi kunjungan.</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold" style={{ color: headingColor }}>2.</span>
          <span>Maksimal peminjaman <strong>3 buku</strong> selama <strong>7 hari</strong>.</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold" style={{ color: headingColor }}>3.</span>
          <span>Dilarang merusak, mencoret, atau melipat halaman buku.</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold" style={{ color: headingColor }}>4.</span>
          <span>Keterlambatan pengembalian dikenakan sanksi tata tertib.</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold" style={{ color: headingColor }}>5.</span>
          <span>Kartu hilang/rusak wajib segera lapor ke pengurus perpustakaan.</span>
        </div>
      </div>

      {/* Signature Section */}
      <div className="px-3 pb-1.5 pt-0.5 border-t border-[#E2E8F0] bg-[#F5F7FA] flex items-center justify-between">
        <div className="text-left font-mono text-[7.5px] text-slate-600">
          <div>ID: <strong style={{ color: headingColor }}>{student.id}</strong></div>
          <div>NISN: {student.nisn || '-'}</div>
        </div>

        {/* Head of Library Stamp & PNG Signature */}
        <div className="text-center text-[7px] leading-tight">
          <div className="text-slate-500">Bengkalis, Kepala Perpustakaan</div>
          <div className="h-6 flex items-center justify-center relative my-0.5">
            {headSignatureUrl ? (
              <img
                src={headSignatureUrl}
                alt="TTD"
                className="max-h-6 max-w-[32mm] object-contain"
              />
            ) : (
              <span className="text-[6.5px] italic text-[#1E3A5F] font-semibold tracking-tighter">
                [ Cap & TTD Resmi ]
              </span>
            )}
          </div>
          <div className="font-bold underline" style={{ color: headingColor }}>{customHeadName}</div>
          <div className="text-[6px] text-slate-500">{customHeadNip}</div>
        </div>
      </div>
    </div>
  );

  // --- TEMPLATE 2: KLASIK PRESTASI (No QR) ---
  const renderClassicPrestigeFront = (student: Student) => (
    <div
      className="w-[85.6mm] h-[54mm] bg-[#FFFFFF] relative overflow-hidden flex select-none box-border border border-[#F5A623]/40 shadow-xs print:shadow-none"
      style={{
        width: '85.6mm',
        height: '54mm',
        minWidth: '85.6mm',
        minHeight: '54mm',
        maxWidth: '85.6mm',
        maxHeight: '54mm',
      }}
    >
      {/* Left Ribbon */}
      <div className="w-[7mm] bg-[#1E3A5F] flex flex-col items-center justify-between py-2 text-white border-r border-[#F5A623] shrink-0">
        <div className="w-4 h-4 rounded-full bg-[#F5A623] flex items-center justify-center text-[#1A1A2E] text-[8px] font-bold">
          ★
        </div>
        <span className="text-[6.5px] font-bold tracking-widest text-amber-200 uppercase [writing-mode:vertical-lr] rotate-180">
          KARTU PERPUSTAKAAN
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
      </div>

      <div className="flex-1 p-2 flex flex-col justify-between relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 shrink-0">
              <SMPN1Logo customUrl={logoUrl} className="w-full h-full object-contain" />
            </div>
            <div className="text-left">
              <div className="text-[9px] font-extrabold leading-tight font-heading" style={{ color: headingColor }}>
                SMP NEGERI 1 BENGKALIS
              </div>
              <div className="text-[7px] font-semibold text-[#F5A623] uppercase">
                Perpustakaan Bunga Tanjung
              </div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-[#1E3A5F] text-white">
            {student.classGrade}
          </span>
        </div>

        {/* Body */}
        <div className="flex items-center gap-2.5 my-0.5">
          <div className="w-[19mm] h-[25mm] rounded border border-[#1E3A5F] p-0.5 bg-white shrink-0 shadow-2xs">
            <img
              src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={student.name}
              className="w-full h-full object-cover rounded-xs"
            />
          </div>

          <div className="flex-1 text-left space-y-0.5 min-w-0" style={{ color: textColor }}>
            <div className="text-[10.5px] font-bold font-heading truncate" style={{ color: headingColor }}>
              {student.name}
            </div>
            <div className="text-[8px] space-y-0.5">
              <div><span className="opacity-70">NISN:</span> <strong>{student.nisn || '-'}</strong></div>
              <div><span className="opacity-70">ID:</span> <strong className="font-mono" style={{ color: headingColor }}>{student.id}</strong></div>
              <div><span className="opacity-70">Status:</span> <span className="text-emerald-700 font-semibold">Anggota Aktif</span></div>
            </div>
          </div>
        </div>

        {/* Footer Barcode */}
        <div className="border-t border-[#E2E8F0] pt-0.5 scale-95 -mb-0.5">
          <CardBarcode value={student.id} height={13} width={1.2} lineColor="#1A1A2E" />
        </div>
      </div>
    </div>
  );

  const renderClassicPrestigeBack = (student: Student) => (
    <div
      className="w-[85.6mm] h-[54mm] bg-[#FFFFFF] relative overflow-hidden flex select-none box-border border border-[#F5A623]/40 shadow-xs print:shadow-none"
      style={{
        width: '85.6mm',
        height: '54mm',
        minWidth: '85.6mm',
        minHeight: '54mm',
        maxWidth: '85.6mm',
        maxHeight: '54mm',
      }}
    >
      <div className="w-[7mm] bg-[#1E3A5F] flex flex-col items-center justify-between py-2 text-white border-r border-[#F5A623] shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
        <span className="text-[6.5px] font-bold tracking-widest text-amber-200 uppercase [writing-mode:vertical-lr] rotate-180">
          KETENTUAN KARTU
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
      </div>

      <div className="flex-1 p-2 flex flex-col justify-between text-left" style={{ color: textColor }}>
        <div>
          <div className="text-[8px] font-bold border-b border-[#F5A623] pb-0.5 uppercase tracking-wide" style={{ color: headingColor }}>
            Ketentuan & Syarat Anggota
          </div>
          <div className="text-[7.2px] mt-1 space-y-0.5 leading-tight opacity-90">
            <div>1. Kartu adalah bukti identitas sah peminjaman pustaka.</div>
            <div>2. Peminjaman maksimal 3 judul buku per siswa.</div>
            <div>3. Wajib menjaga kebersihan dan keutuhan koleksi pustaka.</div>
            <div>4. Tidak dapat dipindahtangankan kepada orang lain.</div>
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-1 flex items-center justify-between">
          <div className="text-[7px]">
            <div>ID: <strong style={{ color: headingColor }}>{student.id}</strong></div>
            <div className="text-slate-500">SMPN 1 Bengkalis</div>
          </div>

          <div className="text-center text-[7px]">
            <div className="h-5 flex items-center justify-center">
              {headSignatureUrl ? (
                <img
                  src={headSignatureUrl}
                  alt="TTD"
                  className="max-h-5 max-w-[28mm] object-contain"
                />
              ) : null}
            </div>
            <div className="font-bold underline" style={{ color: headingColor }}>{customHeadName}</div>
            <div className="text-[6px] text-slate-500">{customHeadNip}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- TEMPLATE 3: MINIMALIS KONTEMPORER (No QR) ---
  const renderCleanTechFront = (student: Student) => (
    <div
      className="w-[85.6mm] h-[54mm] bg-white relative overflow-hidden flex flex-col justify-between p-2.5 select-none box-border border-2 border-[#1E3A5F] shadow-xs print:shadow-none"
      style={{
        width: '85.6mm',
        height: '54mm',
        minWidth: '85.6mm',
        minHeight: '54mm',
        maxWidth: '85.6mm',
        maxHeight: '54mm',
      }}
    >
      <div className="flex items-center justify-between border-b-2 border-[#1E3A5F] pb-1">
        <div className="flex items-center gap-1.5 text-left">
          <div className="w-6 h-6 bg-[#1E3A5F] text-white rounded p-0.5 shrink-0 flex items-center justify-center">
            <SMPN1Logo customUrl={logoUrl} className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-[9.5px] font-black font-heading leading-tight" style={{ color: headingColor }}>
              SMPN 1 BENGKALIS
            </div>
            <div className="text-[7px] font-bold text-[#F5A623] tracking-wide">
              BUNGA TANJUNG LIBRARY
            </div>
          </div>
        </div>

        <div className="bg-[#F5A623] text-[#1A1A2E] text-[7.5px] font-black px-2 py-0.5 rounded">
          {student.classGrade}
        </div>
      </div>

      <div className="flex items-center gap-3 my-auto text-left">
        <div className="w-[19mm] h-[25mm] rounded border-2 border-[#1E3A5F] overflow-hidden shrink-0 shadow-xs">
          <img
            src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={student.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-0.5" style={{ color: textColor }}>
          <h3 className="text-[11px] font-black font-heading truncate" style={{ color: headingColor }}>
            {student.name}
          </h3>
          <div className="text-[8px] space-y-0.5 font-mono">
            <div>NISN : <strong>{student.nisn || '-'}</strong></div>
            <div>CARD : <strong style={{ color: headingColor }}>{student.id}</strong></div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-0.5 scale-95 -mb-0.5">
        <CardBarcode value={student.id} height={14} width={1.25} lineColor="#1A1A2E" />
      </div>
    </div>
  );

  const renderCleanTechBack = (student: Student) => (
    <div
      className="w-[85.6mm] h-[54mm] bg-white relative overflow-hidden flex flex-col justify-between p-2.5 select-none box-border border-2 border-[#1E3A5F] shadow-xs print:shadow-none text-left"
      style={{
        width: '85.6mm',
        height: '54mm',
        minWidth: '85.6mm',
        minHeight: '54mm',
        maxWidth: '85.6mm',
        maxHeight: '54mm',
      }}
    >
      <div className="flex items-center justify-between border-b-2 border-[#1E3A5F] pb-1">
        <span className="text-[8.5px] font-black uppercase font-heading" style={{ color: headingColor }}>
          PANDUAN PEMINJAMAN
        </span>
        <span className="text-[7.5px] font-bold text-[#F5A623]">ID: {student.id}</span>
      </div>

      <div className="text-[7.2px] space-y-0.5 py-1" style={{ color: textColor }}>
        <div>✔ Bawa kartu setiap kunjungan dan peminjaman buku.</div>
        <div>✔ Peminjaman maksimal 3 buku dengan batas waktu 7 hari.</div>
        <div>✔ Jagalah buku agar tetap rapi, bersih, dan tidak robek.</div>
        <div>✔ Segera lapor petugas bila kartu ini hilang atau rusak.</div>
      </div>

      <div className="border-t border-slate-200 pt-1 flex items-center justify-between text-[7px]">
        <div className="font-mono text-slate-500">
          SMPN 1 Bengkalis
        </div>
        <div className="text-right">
          <div className="h-5 flex items-center justify-end">
            {headSignatureUrl ? (
              <img
                src={headSignatureUrl}
                alt="TTD"
                className="max-h-5 max-w-[28mm] object-contain"
              />
            ) : null}
          </div>
          <div className="font-bold underline" style={{ color: headingColor }}>{customHeadName}</div>
          <div className="text-[6px] text-slate-500">{customHeadNip}</div>
        </div>
      </div>
    </div>
  );

  // --- TEMPLATE 4: CUSTOM MANUAL BACKGROUND DESIGN ---
  const renderCustomBackgroundFront = (student: Student) => (
    <div
      className="w-[85.6mm] h-[54mm] relative overflow-hidden flex flex-col justify-between p-2.5 select-none box-border shadow-xs print:shadow-none"
      style={{
        width: '85.6mm',
        height: '54mm',
        minWidth: '85.6mm',
        minHeight: '54mm',
        maxWidth: '85.6mm',
        maxHeight: '54mm',
        backgroundImage: customBgFront ? `url(${customBgFront})` : undefined,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundColor: customBgFront ? 'transparent' : '#F5F7FA',
      }}
    >
      {/* Top Header info (optional logo overlay) */}
      <div className="flex items-center justify-between">
        {showSchoolLogoOnCustom ? (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 shrink-0 bg-white/80 p-0.5 rounded shadow-2xs">
              <SMPN1Logo customUrl={logoUrl} className="w-full h-full object-contain" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-[8.5px] font-black font-heading uppercase" style={{ color: headingColor }}>
                SMPN 1 BENGKALIS
              </div>
              <div className="text-[6.5px] font-bold uppercase" style={{ color: accentColor }}>
                Bunga Tanjung
              </div>
            </div>
          </div>
        ) : <div />}

        <span
          className="px-2 py-0.5 rounded text-[7.5px] font-black uppercase shadow-2xs"
          style={{ backgroundColor: accentColor, color: textColor === '#FFFFFF' ? '#1A1A2E' : '#FFFFFF' }}
        >
          {student.classGrade}
        </span>
      </div>

      {/* Middle Student Details */}
      <div className="flex items-center gap-3 my-auto text-left">
        <div className="w-[19mm] h-[25mm] rounded border-2 border-white/80 overflow-hidden shrink-0 shadow-md bg-white">
          <img
            src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={student.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0 space-y-0.5" style={{ color: textColor }}>
          <div className="text-[11px] font-black font-heading truncate drop-shadow-xs" style={{ color: headingColor }}>
            {student.name}
          </div>
          <div className="text-[8px] space-y-0.5 font-mono drop-shadow-xs">
            <div>NISN : <strong>{student.nisn || '-'}</strong></div>
            <div>ID : <strong style={{ color: headingColor }}>{student.id}</strong></div>
            <div className="text-[7.5px] opacity-90">{customValidity}</div>
          </div>
        </div>
      </div>

      {/* Footer Barcode */}
      <div className="bg-white/85 backdrop-blur-2xs rounded px-2 py-0.5 flex justify-center scale-95 -mb-1 shadow-xs border border-black/5">
        <CardBarcode value={student.id} height={12} width={1.2} lineColor={textColor === '#FFFFFF' ? '#1A1A2E' : textColor} />
      </div>
    </div>
  );

  const renderCustomBackgroundBack = (student: Student) => (
    <div
      className="w-[85.6mm] h-[54mm] relative overflow-hidden flex flex-col justify-between p-2.5 select-none box-border shadow-xs print:shadow-none text-left"
      style={{
        width: '85.6mm',
        height: '54mm',
        minWidth: '85.6mm',
        minHeight: '54mm',
        maxWidth: '85.6mm',
        maxHeight: '54mm',
        backgroundImage: customBgBack ? `url(${customBgBack})` : undefined,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundColor: customBgBack ? 'transparent' : '#F5F7FA',
      }}
    >
      <div className="border-b border-current/20 pb-0.5 flex justify-between items-center" style={{ color: headingColor }}>
        <span className="text-[8px] font-black uppercase tracking-wider font-heading">
          TATA TERTIB PERPUSTAKAAN
        </span>
        <span className="text-[7px] font-mono font-bold" style={{ color: accentColor }}>ID: {student.id}</span>
      </div>

      <div className="text-[7px] space-y-0.5 py-1 leading-tight drop-shadow-xs opacity-95" style={{ color: textColor }}>
        <div>1. Kartu wajib dibawa saat meminjam buku & kunjungan.</div>
        <div>2. Maksimal peminjaman 3 buku selama 7 hari.</div>
        <div>3. Dilarang merusak atau mencoret buku koleksi.</div>
        <div>4. Keterlambatan dikenakan sanksi tata tertib.</div>
      </div>

      <div className="border-t border-current/20 pt-1 flex items-center justify-between text-[7px]" style={{ color: textColor }}>
        <div className="text-[6.5px] opacity-80">
          SMPN 1 Bengkalis
        </div>

        <div className="text-center">
          <div className="h-6 flex items-center justify-center">
            {headSignatureUrl ? (
              <img
                src={headSignatureUrl}
                alt="TTD"
                className="max-h-6 max-w-[28mm] object-contain"
              />
            ) : null}
          </div>
          <div className="font-bold underline" style={{ color: headingColor }}>{customHeadName}</div>
          <div className="text-[6px] opacity-80">{customHeadNip}</div>
        </div>
      </div>
    </div>
  );

  // Master Card Pair Dispatcher (Side by side, zero gap, clean dashed cut/fold line)
  const renderCardPair = (student: Student) => {
    let front = renderModernNavyFront(student);
    let back = renderModernNavyBack(student);

    if (template === 'classic-prestige') {
      front = renderClassicPrestigeFront(student);
      back = renderClassicPrestigeBack(student);
    } else if (template === 'clean-tech') {
      front = renderCleanTechFront(student);
      back = renderCleanTechBack(student);
    } else if (template === 'custom-background') {
      front = renderCustomBackgroundFront(student);
      back = renderCustomBackgroundBack(student);
    }

    return (
      <div
        key={`card-pair-${student.id}`}
        className="card-pair-wrapper flex items-center bg-transparent border border-slate-300 rounded-xs overflow-hidden box-border break-inside-avoid print:border-slate-300 print:shadow-none"
        style={{
          width: '171.2mm',
          height: '54mm',
          margin: '0 auto 3mm auto',
        }}
      >
        {/* Front Side */}
        <div
          className={`card-front-side shrink-0 ${
            showFoldLines ? 'border-r border-dashed border-slate-400' : ''
          }`}
          style={{ width: '85.6mm', height: '54mm' }}
        >
          {front}
        </div>

        {/* Back Side (0 Gap with Front Side) */}
        <div
          className="card-back-side shrink-0"
          style={{ width: '85.6mm', height: '54mm' }}
        >
          {back}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & ACTION BAR                                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#1E3A5F] font-semibold text-xs tracking-wider uppercase mb-1">
            <IdCard className="w-4 h-4 text-[#F5A623]" />
            <span>Studio Cetak Kartu Anggota (A4 Bersisian)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A2E] font-heading">
            Cetak Kartu Siswa Otomatis (Tanpa QR)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sisi Depan dan Belakang dicetak berdampingan di kertas A4 tanpa jarak. Lipat di tengah untuk kartu dua sisi rapi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onBackToMembers && (
            <button
              type="button"
              onClick={onBackToMembers}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E2E8F0] text-[#1A1A2E] hover:bg-[#F5F7FA] font-semibold text-xs transition cursor-pointer"
            >
              Kembali ke Data Siswa
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            disabled={printableStudents.length === 0}
            className="min-h-[44px] px-5 py-2.5 bg-[#F5A623] hover:bg-[#E09618] active:scale-[0.98] disabled:opacity-50 text-[#1A1A2E] font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF ({printableStudents.length} Kartu)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. STUDIO SETTINGS: TEMPLATE, CUSTOM BACKGROUND, TTD & WARNA             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Template, Upload Background, TTD, & Text Color (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Template Selection */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <span className="text-xs font-bold text-[#1A1A2E] font-heading flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#F5A623]" />
                <span>Pilih Format Desain</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Otomatis Tanpa QR</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTemplate('modern-navy')}
                className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                  template === 'modern-navy'
                    ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 shadow-xs font-bold'
                    : 'border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div className="text-xs text-[#1A1A2E]">Modern Navy</div>
                <div className="text-[10px] text-slate-500 font-normal">Header resmi pita biru emas</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('classic-prestige')}
                className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                  template === 'classic-prestige'
                    ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 shadow-xs font-bold'
                    : 'border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div className="text-xs text-[#1A1A2E]">Klasik Prestasi</div>
                <div className="text-[10px] text-slate-500 font-normal">Pita vertikal formal</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('clean-tech')}
                className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                  template === 'clean-tech'
                    ? 'border-[#1E3A5F] bg-[#1E3A5F]/5 shadow-xs font-bold'
                    : 'border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div className="text-xs text-[#1A1A2E]">Minimalis Tebal</div>
                <div className="text-[10px] text-slate-500 font-normal">Border tegas kontemporer</div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('custom-background')}
                className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${
                  template === 'custom-background'
                    ? 'border-[#F5A623] bg-[#F5A623]/10 shadow-xs font-bold text-[#1A1A2E]'
                    : 'border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div className="text-xs flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>Desain Sendiri</span>
                </div>
                <div className="text-[10px] text-slate-500 font-normal">Unggah background JPG/PNG</div>
              </button>
            </div>
          </div>

          {/* Custom Background Upload Card (If custom background is active or uploaded) */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <span className="font-bold text-[#1A1A2E] font-heading flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#1E3A5F]" />
                <span>Unggah Desain Background Kartu</span>
              </span>
              <span className="text-[10px] text-slate-400">Ukuran 85.6 × 54 mm</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Front Background Upload */}
              <div className="space-y-1.5">
                <label className="block text-slate-600 font-semibold text-[11px]">
                  Background Sisi Depan
                </label>
                <input
                  type="file"
                  ref={bgFrontInputRef}
                  accept="image/*"
                  onChange={handleBgFrontUpload}
                  className="hidden"
                />
                {customBgFront ? (
                  <div className="relative group rounded-lg overflow-hidden border border-[#E2E8F0] h-18 bg-slate-100 flex items-center justify-center">
                    <img src={customBgFront} alt="Depan" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCustomBgFront(null)}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => bgFrontInputRef.current?.click()}
                    className="w-full h-18 rounded-lg border-2 border-dashed border-[#E2E8F0] hover:border-[#1E3A5F] flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#1E3A5F] transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[10px] font-semibold">Pilih Gambar Depan</span>
                  </button>
                )}
              </div>

              {/* Back Background Upload */}
              <div className="space-y-1.5">
                <label className="block text-slate-600 font-semibold text-[11px]">
                  Background Sisi Belakang
                </label>
                <input
                  type="file"
                  ref={bgBackInputRef}
                  accept="image/*"
                  onChange={handleBgBackUpload}
                  className="hidden"
                />
                {customBgBack ? (
                  <div className="relative group rounded-lg overflow-hidden border border-[#E2E8F0] h-18 bg-slate-100 flex items-center justify-center">
                    <img src={customBgBack} alt="Belakang" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCustomBgBack(null)}
                      className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => bgBackInputRef.current?.click()}
                    className="w-full h-18 rounded-lg border-2 border-dashed border-[#E2E8F0] hover:border-[#1E3A5F] flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-[#1E3A5F] transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[10px] font-semibold">Pilih Gambar Belakang</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Color Customizer & Signature Card */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs space-y-3.5 text-xs">
            {/* Color Customizer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <span className="font-bold text-[#1A1A2E] font-heading flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-[#F5A623]" />
                  <span>Warna Tulisan & Teks Kartu</span>
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyTextColorPreset('dark')}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold bg-[#1A1A2E] text-white cursor-pointer"
                >
                  Teks Gelap
                </button>
                <button
                  type="button"
                  onClick={() => applyTextColorPreset('light')}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold bg-slate-100 text-slate-800 cursor-pointer"
                >
                  Teks Terang (Putih)
                </button>
                <button
                  type="button"
                  onClick={() => applyTextColorPreset('gold')}
                  className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold bg-[#F5A623] text-[#1A1A2E] cursor-pointer"
                >
                  Emas
                </button>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Warna Teks Utama</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-8 rounded border border-[#E2E8F0] cursor-pointer p-0.5 bg-white"
                    />
                    <span className="font-mono text-xs text-slate-700 uppercase">{textColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Warna Nama / Judul</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={headingColor}
                      onChange={(e) => setHeadingColor(e.target.value)}
                      className="w-8 h-8 rounded border border-[#E2E8F0] cursor-pointer p-0.5 bg-white"
                    />
                    <span className="font-mono text-xs text-slate-700 uppercase">{headingColor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signature Upload */}
            <div className="border-t border-[#E2E8F0] pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1A1A2E] font-heading flex items-center gap-1.5">
                  <PenTool className="w-4 h-4 text-[#1E3A5F]" />
                  <span>Tanda Tangan Kepala Perpustakaan (PNG)</span>
                </span>
              </div>

              <input
                type="file"
                ref={sigFileInputRef}
                accept="image/png,image/webp"
                onChange={handleSignatureUpload}
                className="hidden"
              />

              {headSignatureUrl ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#F5F7FA] border border-[#E2E8F0]">
                  <div className="flex items-center gap-2">
                    <img src={headSignatureUrl} alt="TTD" className="h-8 max-w-[40mm] object-contain bg-white rounded p-1 border border-[#E2E8F0]" />
                    <span className="text-[11px] font-semibold text-[#10B981]">TTD Siap Dicetak</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHeadSignatureUrl(null)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => sigFileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] hover:bg-slate-200 text-[#1E3A5F] font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah File TTD Transparan (PNG)</span>
                </button>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Nama Kepala Perpustakaan</label>
                  <input
                    type="text"
                    value={customHeadName}
                    onChange={(e) => setCustomHeadName(e.target.value)}
                    className="w-full min-h-[36px] px-3 py-1 rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1 text-[11px]">NIP</label>
                  <input
                    type="text"
                    value={customHeadNip}
                    onChange={(e) => setCustomHeadNip(e.target.value)}
                    className="w-full min-h-[36px] px-3 py-1 rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Student Selection Table & Filters (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, NISN, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-h-[40px] pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] text-xs font-medium focus:ring-2 focus:ring-[#F5A623]"
              />
            </div>

            {/* Class Filter */}
            <div className="w-auto min-w-[120px]">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full min-h-[40px] px-3 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] text-xs font-semibold text-[#1A1A2E] focus:ring-2 focus:ring-[#F5A623]"
              >
                {classesList.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Selection Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] hover:bg-slate-200 text-[#1A1A2E] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#1E3A5F]" />
                <span>Pilih Semua</span>
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F5F7FA] hover:bg-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            </div>
          </div>

          {/* Student Selection List Table */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-[#F5F7FA] border-b border-[#E2E8F0] flex items-center justify-between text-xs">
              <span className="font-bold text-[#1A1A2E]">
                Daftar Siswa: {filteredStudents.length} siswa
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#1E3A5F] text-white font-bold text-[11px]">
                {selectedIds.length} kartu dipilih
              </span>
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-[#E2E8F0] text-xs">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  Tidak ada siswa yang sesuai filter
                </div>
              ) : (
                filteredStudents.map((student) => {
                  const isChecked = selectedIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleStudent(student.id)}
                      className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#1E3A5F]/5 hover:bg-[#1E3A5F]/10' : 'hover:bg-[#F5F7FA]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-[#1E3A5F] focus:ring-[#F5A623] w-4 h-4"
                        />

                        <img
                          src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt=""
                          className="w-8 h-8 rounded object-cover border border-[#E2E8F0] shrink-0"
                        />

                        <div className="min-w-0 text-left">
                          <div className="font-bold text-[#1A1A2E] truncate leading-tight">
                            {student.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            NISN: {student.nisn || '-'} • ID: {student.id}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-[#1E3A5F] border border-[#E2E8F0]">
                          {student.classGrade}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LIVE A4 PRINT PREVIEW CANVAS (Side-by-Side Foldable Sheet)             */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-[#1E3A5F]" />
            <h3 className="text-sm font-bold text-[#1A1A2E] font-heading">
              Pratinjau Lembar Cetak A4 (Sisi Depan & Belakang Bersisian Tanpa Jarak)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Garis putus-putus tengah sebagai pemandu lipatan
          </span>
        </div>

        {/* The Printable A4 Container Area */}
        <div className="bg-slate-100 p-4 sm:p-8 rounded-xl border border-[#E2E8F0] overflow-x-auto shadow-inner">
          <div
            id="printable-a4-sheet"
            className="a4-sheet-container bg-white shadow-xl mx-auto p-4 sm:p-6 text-center box-border"
            style={{
              width: '210mm',
              minHeight: '297mm',
              maxWidth: '100%',
              margin: '0 auto',
            }}
          >
            {/* Sheet Sub-Header (Screen Preview Only) */}
            <div className="print:hidden mb-4 pb-2 border-b border-slate-200 text-left flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Kertas: <strong>A4 Portrait</strong> (210mm × 297mm) • Format Lipat</span>
              </div>
              <span>Siap Cetak / Export ke PDF</span>
            </div>

            {/* Render Card Pairs Grid */}
            {printableStudents.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <IdCard className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Belum ada siswa yang dipilih</p>
                <p className="text-xs">Centang siswa pada tabel di atas untuk menampilkan pratinjau kartu.</p>
              </div>
            ) : (
              <div className="cards-grid-layout space-y-3 print:space-y-2">
                {printableStudents.map((student) => renderCardPair(student))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DEDICATED PRINT STYLESHEET                                             */}
      {/* ========================================================================= */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-a4-sheet,
          #printable-a4-sheet * {
            visibility: visible;
          }
          #printable-a4-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .card-pair-wrapper {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 4mm !important;
          }
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
        }
      `}</style>
    </div>
  );
};
