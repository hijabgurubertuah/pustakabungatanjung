export interface WelcomeThemePreset {
  id: string;
  name: string;
  hex: string;
  badgeBg: string;
  bgClass: string;
  cardClass: string;
  topGlowClass: string;
  subtitleClass: string;
  quoteClass: string;
  inputClass: string;
  scanBtnClass: string;
  scanIconClass: string;
  submitBtnClass: string;
  mottoClass: string;
  copyrightClass: string;
  footerTextClass: string;
  selectionClass: string;
}

export const WELCOME_THEMES: Record<string, WelcomeThemePreset> = {
  sky: {
    id: 'sky',
    name: 'Biru Langit (Standar)',
    hex: '#0284c7',
    badgeBg: 'bg-sky-500',
    bgClass: 'bg-[#061d31] bg-radial from-[#0284c7] via-[#0369a1] to-[#041829]',
    cardClass: 'bg-[#07243c]/95 border-sky-400/30 text-white shadow-[0_0_50px_rgba(2,132,199,0.25)]',
    topGlowClass: 'bg-sky-400/20',
    subtitleClass: 'text-sky-100/95',
    quoteClass: 'text-sky-200/85',
    inputClass: 'bg-[#f0f8ff] text-slate-900 border-sky-900/10 focus:ring-sky-400 focus:bg-white',
    scanBtnClass: 'bg-sky-950/90 hover:bg-sky-900 text-sky-100 hover:text-white border-2 border-sky-400/70 hover:border-sky-300 shadow-md shadow-sky-950/50 hover:shadow-sky-400/20',
    scanIconClass: 'text-sky-400',
    submitBtnClass: 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white shadow-[0_4px_25px_rgba(2,132,199,0.45)]',
    mottoClass: 'text-sky-400',
    copyrightClass: 'text-sky-400/70',
    footerTextClass: 'text-sky-400/60',
    selectionClass: 'selection:bg-sky-500 selection:text-white',
  },
  emerald: {
    id: 'emerald',
    name: 'Hijau Zamrud',
    hex: '#059669',
    badgeBg: 'bg-emerald-500',
    bgClass: 'bg-[#021814] bg-radial from-[#073027] via-[#041f19] to-[#021310]',
    cardClass: 'bg-[#03231d] border-emerald-500/25 text-white shadow-[0_0_60px_rgba(16,185,129,0.18)]',
    topGlowClass: 'bg-emerald-500/10',
    subtitleClass: 'text-emerald-100/95',
    quoteClass: 'text-emerald-200/85',
    inputClass: 'bg-[#f0f4f2] text-slate-900 border-emerald-900/10 focus:ring-emerald-400 focus:bg-white',
    scanBtnClass: 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-100 hover:text-white border-2 border-emerald-400/70 hover:border-emerald-300 shadow-md shadow-emerald-950/50 hover:shadow-emerald-400/20',
    scanIconClass: 'text-emerald-400',
    submitBtnClass: 'bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#34d399] hover:to-[#10b981] text-white shadow-[0_4px_25px_rgba(16,185,129,0.45)]',
    mottoClass: 'text-emerald-400',
    copyrightClass: 'text-emerald-400/70',
    footerTextClass: 'text-emerald-500/60',
    selectionClass: 'selection:bg-emerald-500 selection:text-white',
  },
  navy: {
    id: 'navy',
    name: 'Biru Bahari / Indigo',
    hex: '#4338ca',
    badgeBg: 'bg-indigo-600',
    bgClass: 'bg-[#0a0f24] bg-radial from-[#1e1b4b] via-[#0f172a] to-[#030712]',
    cardClass: 'bg-[#131b3e] border-indigo-500/30 text-white shadow-[0_0_50px_rgba(99,102,241,0.22)]',
    topGlowClass: 'bg-indigo-500/20',
    subtitleClass: 'text-indigo-100/95',
    quoteClass: 'text-indigo-200/85',
    inputClass: 'bg-[#f1f3fd] text-slate-900 border-indigo-900/10 focus:ring-indigo-400 focus:bg-white',
    scanBtnClass: 'bg-indigo-950/90 hover:bg-indigo-900 text-indigo-100 hover:text-white border-2 border-indigo-400/70 hover:border-indigo-300 shadow-md shadow-indigo-950/50 hover:shadow-indigo-400/20',
    scanIconClass: 'text-indigo-400',
    submitBtnClass: 'bg-gradient-to-r from-[#4f46e5] to-[#3730a3] hover:from-[#6366f1] hover:to-[#4f46e5] text-white shadow-[0_4px_25px_rgba(79,70,229,0.45)]',
    mottoClass: 'text-indigo-400',
    copyrightClass: 'text-indigo-400/70',
    footerTextClass: 'text-indigo-400/60',
    selectionClass: 'selection:bg-indigo-500 selection:text-white',
  },
  violet: {
    id: 'violet',
    name: 'Ungu Anggun',
    hex: '#7e22ce',
    badgeBg: 'bg-purple-600',
    bgClass: 'bg-[#160624] bg-radial from-[#3b0764] via-[#1f0933] to-[#09020e]',
    cardClass: 'bg-[#240d3b] border-purple-500/30 text-white shadow-[0_0_50px_rgba(168,85,247,0.22)]',
    topGlowClass: 'bg-purple-500/20',
    subtitleClass: 'text-purple-100/95',
    quoteClass: 'text-purple-200/85',
    inputClass: 'bg-[#faf5ff] text-slate-900 border-purple-900/10 focus:ring-purple-400 focus:bg-white',
    scanBtnClass: 'bg-purple-950/90 hover:bg-purple-900 text-purple-100 hover:text-white border-2 border-purple-400/70 hover:border-purple-300 shadow-md shadow-purple-950/50 hover:shadow-purple-400/20',
    scanIconClass: 'text-purple-400',
    submitBtnClass: 'bg-gradient-to-r from-[#9333ea] to-[#6b21a8] hover:from-[#a855f7] hover:to-[#9333ea] text-white shadow-[0_4px_25px_rgba(147,51,234,0.45)]',
    mottoClass: 'text-purple-400',
    copyrightClass: 'text-purple-400/70',
    footerTextClass: 'text-purple-400/60',
    selectionClass: 'selection:bg-purple-500 selection:text-white',
  },
  slate: {
    id: 'slate',
    name: 'Gelap Modern / Elegan',
    hex: '#334155',
    badgeBg: 'bg-slate-700',
    bgClass: 'bg-[#090d16] bg-radial from-[#1e293b] via-[#0f172a] to-[#020617]',
    cardClass: 'bg-[#141b2d] border-slate-700/60 text-white shadow-[0_0_50px_rgba(148,163,184,0.15)]',
    topGlowClass: 'bg-slate-400/15',
    subtitleClass: 'text-slate-200',
    quoteClass: 'text-slate-300/85',
    inputClass: 'bg-[#f8fafc] text-slate-900 border-slate-400/20 focus:ring-blue-500 focus:bg-white',
    scanBtnClass: 'bg-slate-800/95 hover:bg-slate-700 text-slate-100 hover:text-white border-2 border-slate-500/70 hover:border-slate-300 shadow-md shadow-slate-950/50 hover:shadow-slate-400/20',
    scanIconClass: 'text-sky-400',
    submitBtnClass: 'bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#3b82f6] hover:to-[#2563eb] text-white shadow-[0_4px_25px_rgba(37,99,235,0.4)]',
    mottoClass: 'text-sky-400',
    copyrightClass: 'text-slate-400',
    footerTextClass: 'text-slate-400/60',
    selectionClass: 'selection:bg-blue-600 selection:text-white',
  },
};

export const getWelcomeTheme = (themeId?: string, customColor?: string): WelcomeThemePreset => {
  if (themeId && WELCOME_THEMES[themeId]) {
    return WELCOME_THEMES[themeId];
  }

  // If custom color is provided
  if (themeId === 'custom' && customColor) {
    return {
      id: 'custom',
      name: 'Warna Kustom',
      hex: customColor,
      badgeBg: 'bg-sky-500',
      bgClass: 'bg-[#061d31] bg-radial from-[#0284c7] via-[#0369a1] to-[#041829]',
      cardClass: 'bg-[#07243c]/95 border-sky-400/30 text-white shadow-[0_0_50px_rgba(2,132,199,0.25)]',
      topGlowClass: 'bg-sky-400/20',
      subtitleClass: 'text-sky-100/95',
      quoteClass: 'text-sky-200/85',
      inputClass: 'bg-[#f0f8ff] text-slate-900 border-sky-900/10 focus:ring-sky-400 focus:bg-white',
      scanBtnClass: 'bg-sky-950/90 hover:bg-sky-900 text-sky-100 hover:text-white border-2 border-sky-400/70 hover:border-sky-300 shadow-md shadow-sky-950/50 hover:shadow-sky-400/20',
      scanIconClass: 'text-sky-400',
      submitBtnClass: 'bg-gradient-to-r from-[#0284c7] to-[#0369a1] hover:from-[#38bdf8] hover:to-[#0284c7] text-white shadow-[0_4px_25px_rgba(2,132,199,0.45)]',
      mottoClass: 'text-sky-400',
      copyrightClass: 'text-sky-400/70',
      footerTextClass: 'text-sky-400/60',
      selectionClass: 'selection:bg-sky-500 selection:text-white',
    };
  }

  // Default is Biru Langit
  return WELCOME_THEMES.sky;
};
