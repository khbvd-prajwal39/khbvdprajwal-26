import { LANGUAGES } from '@/i18n/translations';
import { t } from '@/i18n/translations';
import type { LanguageCode } from '@/types';
import { Globe, Check, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import BrandLogo from '@/components/BrandLogo';

interface Props {
  onContinue: (lang: LanguageCode) => void;
}

export default function LanguageScreen({ onContinue }: Props) {
  const [selected, setSelected] = useState<LanguageCode>('en');
  const [search, setSearch] = useState('');

  const filtered = LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(search.toLowerCase()) ||
    l.nativeLabel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 flex flex-col items-center">
      <div className="w-full max-w-2xl px-6 pt-16 pb-8 flex flex-col items-center">
        <div className="mb-6"><BrandLogo /></div>
        <p className="text-slate-500 mt-2 text-center">{t(selected, 'appTagline')}</p>
      </div>

      <div className="w-full max-w-2xl px-6 flex-1">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-1">
            <Globe className="w-5 h-5 text-teal-600" />
            <h2 className="text-xl font-semibold text-slate-800">{t(selected, 'selectLanguage')}</h2>
          </div>
          <p className="text-sm text-slate-400 mb-5 ml-8">{t(selected, 'selectLanguageSubtitle')}</p>

          <input
            type="text"
            placeholder="Search language..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm mb-4"
          />

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {filtered.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all ${
                  selected === lang.code
                    ? 'bg-teal-50 border-teal-400 ring-1 ring-teal-200'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-left">
                    <p className="font-medium text-slate-700 text-sm">{lang.label}</p>
                    <p className="text-xs text-slate-400">{lang.nativeLabel}</p>
                  </div>
                </div>
                {selected === lang.code && (
                  <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onContinue(selected)}
          className="w-full mt-6 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {t(selected, 'continue')}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="h-12" />
    </div>
  );
}
