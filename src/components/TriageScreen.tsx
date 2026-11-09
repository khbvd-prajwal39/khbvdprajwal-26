import { t } from '@/i18n/translations';
import type { LanguageCode, Doctor } from '@/types';
import { ArrowLeft, ClipboardList, Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
  lang: LanguageCode;
  doctor: Doctor;
  onBack: () => void;
  onContinue: (chiefComplaint: string, symptomDuration: string) => void;
}

const DURATION_OPTIONS: { key: string; langKey: string }[] = [
  { key: 'last-few-hours', langKey: 'lastFewHours' },
  { key: 'last-1-day', langKey: 'last1Day' },
  { key: 'last-2-days', langKey: 'last2Days' },
  { key: 'last-3-days', langKey: 'last3Days' },
  { key: 'last-1-week', langKey: 'last1Week' },
  { key: 'last-2-weeks', langKey: 'last2Weeks' },
  { key: 'last-1-month', langKey: 'last1Month' },
  { key: 'several-months', langKey: 'severalMonths' },
];

export default function TriageScreen({ lang, doctor, onBack, onContinue }: Props) {
  const [complaint, setComplaint] = useState('');
  const [duration, setDuration] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState(false);

  const handleContinue = () => {
    const finalDuration = showCustom ? customDuration.trim() : duration;
    if (!complaint.trim() || !finalDuration.trim()) {
      setError(true);
      return;
    }
    onContinue(complaint.trim(), finalDuration.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/40 to-cyan-50/30">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-slate-800 text-base">{doctor.name}</h1>
            <p className="text-xs text-slate-400">{doctor.specialty}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 pt-8 pb-16">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{t(lang, 'chiefComplaint')}</h2>
          <p className="text-sm text-slate-400 mt-1">Please provide details for your consultation</p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100 p-6 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <ClipboardList className="w-4 h-4 text-teal-600" />
              {t(lang, 'chiefComplaint')}
            </label>
            <textarea
              value={complaint}
              onChange={e => { setComplaint(e.target.value); setError(false); }}
              placeholder={t(lang, 'chiefComplaintPlaceholder')}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
              <Clock className="w-4 h-4 text-teal-600" />
              {t(lang, 'durationOfSymptoms')}
            </label>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => { setDuration(t(lang, opt.langKey)); setShowCustom(false); setError(false); }}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    !showCustom && duration === t(lang, opt.langKey)
                      ? 'bg-teal-50 border-teal-400 text-teal-700 ring-1 ring-teal-200'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                  }`}
                >
                  {t(lang, opt.langKey)}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setShowCustom(true); setDuration(''); setError(false); }}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                showCustom
                  ? 'bg-teal-50 border-teal-400 text-teal-700 ring-1 ring-teal-200'
                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'
              }`}
            >
              {t(lang, 'custom')}
            </button>

            {showCustom && (
              <input
                type="text"
                value={customDuration}
                onChange={e => { setCustomDuration(e.target.value); setError(false); }}
                placeholder={t(lang, 'enterDuration')}
                className="w-full mt-2 px-4 py-3 rounded-xl border border-slate-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm"
              />
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {t(lang, 'pleaseFillBoth')}
            </div>
          )}
        </div>

        <button
          onClick={handleContinue}
          className="w-full mt-6 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {t(lang, 'next')}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
