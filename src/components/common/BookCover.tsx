import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  coverUrl?: string | null;
  title?: string;
  className?: string;
  alt?: string;
  showTitle?: boolean;
}

export const BookCover: React.FC<BookCoverProps> = ({
  coverUrl,
  title,
  className = '',
  alt,
  showTitle = false,
}) => {
  const { logoUrl } = useLibrary();
  const [imageError, setImageError] = useState(false);

  const cleanCover = coverUrl?.trim();
  const hasValidCover = cleanCover && !cleanCover.includes('images.unsplash.com') && !imageError;

  if (hasValidCover) {
    return (
      <img
        src={cleanCover}
        alt={alt || title || 'Sampul Buku'}
        onError={() => setImageError(true)}
        className={`object-cover ${className}`}
      />
    );
  }

  // Auto-generated elegant book cover featuring library logo
  return (
    <div
      className={`relative overflow-hidden select-none flex flex-col items-center justify-between p-1.5 bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 text-white shadow-xs ${className}`}
      title={title || 'Sampul Buku Perpustakaan'}
    >
      {/* Book Spine Shadow on Left Edge */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/40 via-black/15 to-transparent pointer-events-none z-10" />

      {/* Decorative Book Border (Foil Line) */}
      <div className="absolute inset-1 border border-amber-300/30 rounded-xs pointer-events-none" />

      {/* Top Foil Header Bar */}
      <div className="w-full flex items-center justify-center pt-0.5 z-0">
        <span className="text-[7px] uppercase tracking-widest text-emerald-200/80 font-bold line-clamp-1 scale-90 sm:scale-100">
          Perpustakaan
        </span>
      </div>

      {/* Center: Library Logo Styled on Book Cover */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto z-0 p-1">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 p-1 shadow-md ring-1 ring-amber-300/50 flex items-center justify-center overflow-hidden shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // If logo fails, fallback to BookOpen icon
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <BookOpen className="w-4 h-4 text-emerald-700" />
          )}
        </div>
      </div>

      {/* Bottom Title / Brand */}
      <div className="w-full text-center z-0 px-0.5 pb-0.5">
        <p className="text-[8px] font-semibold text-emerald-100 line-clamp-1 leading-tight">
          {title || 'Bunga Tanjung'}
        </p>
      </div>
    </div>
  );
};
