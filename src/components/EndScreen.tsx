import { useState } from 'react';
import { CheckCircle2, Home, Star } from 'lucide-react';
import { t } from '@/i18n/translations';
import type { LanguageCode } from '@/types';
import { supabase } from '@/lib/supabase';

interface Props { lang: LanguageCode; doctorName: string; onHome: () => void; }

export default function EndScreen({ lang, doctorName, onHome }: Props) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [prescription, setPrescription] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const submitReview = async () => {
    if (rating < 1 || review.trim().length < 50 || prescription === null) {
      setError('Choose a rating, answer the prescription question, and write at least 50 characters.');
      return;
    }
    const { error: saveError } = await supabase.from('consultation_reviews').insert({ doctor_name: doctorName, rating, review: review.trim(), prescription_requested: prescription });
    if (saveError) {
      console.error('consultation review save failed', saveError);
      setError('We could not save your review. Please try again.');
      return;
    }
    setSubmitted(true);
  };

  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/40 to-cyan-50/30 px-6 py-10"><div className="mx-auto max-w-lg">{submitted ? <div className="flex min-h-[70vh] flex-col items-center justify-center text-center"><div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500"><CheckCircle2 className="h-8 w-8 text-white" /></div></div><h1 className="mb-2 text-2xl font-bold text-slate-800">Thank you for your review</h1><p className="mb-8 text-sm leading-relaxed text-slate-500">{prescription ? 'Your prescription request has been sent to the doctor.' : 'Your feedback helps KHBV.D improve trusted care.'}</p><button onClick={onHome} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-3.5 font-semibold text-white shadow-lg"><Home className="h-5 w-5" />{t(lang, 'home')}</button></div> : <div className="rounded-[2rem] bg-white p-6 shadow-xl sm:p-8"><div className="mb-7 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><CheckCircle2 className="h-8 w-8" /></div><h1 className="text-2xl font-bold text-slate-800">Consultation complete</h1><p className="mt-2 text-sm text-slate-500">How was your consultation with {doctorName}?</p></div><label className="text-sm font-semibold text-slate-700">Your rating</label><div className="mt-2 flex gap-2">{[1, 2, 3, 4, 5].map(value => <button key={value} onClick={() => setRating(value)} aria-label={`${value} stars`}><Star className={`h-7 w-7 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} /></button>)}</div><label className="mt-6 block text-sm font-semibold text-slate-700">Your review <span className="font-normal text-slate-400">(minimum 50 characters)</span></label><textarea value={review} onChange={event => setReview(event.target.value)} className="field mt-2 min-h-32 resize-none" placeholder="Tell us what was helpful about your consultation..." /><p className="mt-1 text-right text-xs text-slate-400">{review.length}/50 minimum</p><label className="mt-5 block text-sm font-semibold text-slate-700">Would you like a prescription?</label><div className="mt-2 grid grid-cols-2 gap-3"><button onClick={() => setPrescription(true)} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${prescription === true ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-500'}`}>Yes, please</button><button onClick={() => setPrescription(false)} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${prescription === false ? 'border-teal-500 bg-teal-50 text-teal-800' : 'border-slate-200 text-slate-500'}`}>No, thank you</button></div>{error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button onClick={submitReview} className="primary-button mt-6 w-full">Submit review</button></div>}</div></div>;
}
