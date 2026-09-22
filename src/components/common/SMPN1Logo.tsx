import React from 'react';

interface SMPN1LogoProps {
  className?: string;
  size?: number | string;
  customUrl?: string;
  alt?: string;
}

export const SMPN1Logo: React.FC<SMPN1LogoProps> = ({
  className = 'w-16 h-20',
  customUrl,
  alt = 'Logo SMPN 1 Bengkalis',
}) => {
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt={alt}
        className={`${className} object-contain`}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Authentic vector recreation of SMP Negeri 1 Bengkalis shield emblem
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 120 150"
        className="w-full h-full drop-shadow-md"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#40c9ff" />
            <stop offset="50%" stopColor="#e81cff" />
            <stop offset="100%" stopColor="#38ef7d" />
          </linearGradient>
          <linearGradient id="crestBg" x1="60" y1="10" x2="60" y2="115" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* Shield Outer Outline with decorative border */}
        <path
          d="M60 8 C88 8 108 20 108 45 C108 92 78 120 60 130 C42 120 12 92 12 45 C12 20 32 8 60 8 Z"
          fill="#1e1b4b"
          stroke="url(#shieldGrad)"
          strokeWidth="3.5"
        />

        {/* Inner Shield Body */}
        <path
          d="M60 14 C84 14 102 24 102 46 C102 87 75 112 60 122 C45 112 18 87 18 46 C18 24 36 14 60 14 Z"
          fill="url(#crestBg)"
          stroke="#38bdf8"
          strokeWidth="1.5"
        />

        {/* Top Text Header Banner */}
        <rect x="25" y="19" width="70" height="12" rx="3" fill="#0284c7" />
        <text
          x="60"
          y="28"
          fill="#ffffff"
          fontSize="7.5"
          fontWeight="bold"
          textAnchor="middle"
          letterSpacing="0.8"
          fontFamily="system-ui, sans-serif"
        >
          SMP NEGERI 1
        </text>

        {/* Laurel Wreath / Rice & Cotton (Left & Right) */}
        <path
          d="M32 45 C28 55 28 75 38 88"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
        <path
          d="M88 45 C92 55 92 75 82 88"
          stroke="#ca8a04"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />

        {/* Center Stylized Torch & Figures */}
        {/* Flame / Star */}
        <circle cx="60" cy="42" r="5" fill="#f43f5e" />
        <path d="M57 44 L60 35 L63 44 Z" fill="#fbbf24" />

        {/* Human figures holding hands (Blue & Pink) */}
        <path
          d="M52 48 C49 53 53 62 60 62 C67 62 71 53 68 48 C65 52 55 52 52 48 Z"
          fill="#0284c7"
        />
        <circle cx="54" cy="46" r="3.2" fill="#0284c7" />
        <circle cx="66" cy="46" r="3.2" fill="#ec4899" />

        {/* Open Book */}
        <path
          d="M40 76 C48 73 57 74 60 76 C63 74 72 73 80 76 L78 86 C70 83 62 84 60 86 C58 84 50 83 42 86 Z"
          fill="#ffffff"
          stroke="#0f172a"
          strokeWidth="1.2"
        />
        <path d="M60 76 L60 86" stroke="#0f172a" strokeWidth="1.2" />

        {/* Sea Waves / Bengkalis Coastal Symbol */}
        <path
          d="M36 93 Q48 89 60 93 T84 93"
          stroke="#0284c7"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M40 98 Q50 94 60 98 T80 98"
          stroke="#38bdf8"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Bottom Banner with Bengkalis Text */}
        <path
          d="M20 114 C36 126 84 126 100 114 L96 130 C76 138 44 138 24 130 Z"
          fill="#e11d48"
          stroke="#fde047"
          strokeWidth="1.2"
        />
        <text
          x="60"
          y="126"
          fill="#ffffff"
          fontSize="7.5"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="1.2"
          fontFamily="system-ui, sans-serif"
        >
          BENGKALIS
        </text>
      </svg>
    </div>
  );
};
