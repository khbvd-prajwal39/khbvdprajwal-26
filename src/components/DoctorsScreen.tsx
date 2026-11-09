import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { t } from '@/i18n/translations';
import type { LanguageCode, Procedure, Doctor } from '@/types';
import { ArrowLeft, Star, MapPin, Clock, BadgeCheck, ChevronRight, Circle } from 'lucide-react';

interface Props {
  lang: LanguageCode;
  procedure: Procedure;
  onBack: () => void;
  onSelectDoctor: (doctor: Doctor) => void;
}

export default function DoctorsScreen({ lang, procedure, onBack, onSelectDoctor }: Props) {
  const [approvedDoctors, setApprovedDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    supabase.rpc('list_khbvd_approved_doctors').then(({ data }) => {
      if (!data) return;
      setApprovedDoctors(data.map((row: { id: string; full_name: string; specialty: string; district: string; city: string; years_experience: number; essential_price: number; essential_plus_price: number; audio_price: number; video_price: number }) => ({
        id: row.id,
        name: row.full_name,
        location: `${row.city}, ${row.district}`,
        experience: row.years_experience,
        rating: 5,
        status: 'online',
        specialty: row.specialty,
        initials: row.full_name.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase(),
        prices: { essential: Number(row.essential_price), essential_plus: Number(row.essential_plus_price), audio: Number(row.audio_price), video: Number(row.video_price) },
      })));
    });
  }, [procedure.id]);

  const doctors = useMemo(() => {
    const matchesCategory = (doctor: Doctor) => procedure.category === 'Veterinary' ? doctor.specialty.toLowerCase().includes('veter') : !doctor.specialty.toLowerCase().includes('veter');
    return [...procedure.doctors, ...approvedDoctors.filter(doctor => matchesCategory(doctor) && !procedure.doctors.some(existing => existing.id === doctor.id))];
  }, [approvedDoctors, procedure]);
  const onlineDoctors = doctors.filter(d => d.status === 'online');
  const offlineDoctors = doctors.filter(d => d.status === 'offline');

  const renderDoctor = (doctor: Doctor) => (
    <button
      key={doctor.id}
      onClick={() => onSelectDoctor(doctor)}
      className="w-full bg-white rounded-2xl p-4 border border-slate-100 text-left hover:border-teal-200 hover:shadow-lg hover:shadow-teal-100/40 transition-all active:scale-[0.99] flex items-center gap-4"
    >
      <div className="relative shrink-0">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
          doctor.status === 'online'
            ? 'bg-gradient-to-br from-teal-500 to-cyan-600'
            : 'bg-gradient-to-br from-slate-400 to-slate-500'
        }`}>
          {doctor.initials}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white ${
            doctor.status === 'online' ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={doctor.status === 'online' ? t(lang, 'online') : t(lang, 'offline')}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <h3 className="font-semibold text-slate-800 text-sm truncate">{doctor.name}</h3>
          <BadgeCheck className="w-4 h-4 text-teal-500 shrink-0" />
        </div>
        <p className="text-xs text-slate-400 mb-2">{doctor.specialty}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {doctor.location}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {doctor.experience} {t(lang, 'yearsExperience')}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {doctor.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg ${
          doctor.status === 'online'
            ? 'text-green-600 bg-green-50'
            : 'text-red-500 bg-red-50'
        }`}>
          <Circle className="w-2 h-2 fill-current" />
          {doctor.status === 'online' ? t(lang, 'online') : t(lang, 'offline')}
        </span>
        <ChevronRight className="w-5 h-5 text-slate-300" />
      </div>
    </button>
  );

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
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-slate-800 text-base truncate">{procedure.name}</h1>
            <p className="text-xs text-slate-400">{doctors.length} {t(lang, 'availableDoctors')}</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 pt-6 pb-16">
        {onlineDoctors.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{t(lang, 'online')} ({onlineDoctors.length})</h2>
            </div>
            <div className="space-y-3">
              {onlineDoctors.map(renderDoctor)}
            </div>
          </div>
        )}

        {offlineDoctors.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">{t(lang, 'offline')} ({offlineDoctors.length})</h2>
            </div>
            <div className="space-y-3">
              {offlineDoctors.map(renderDoctor)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
