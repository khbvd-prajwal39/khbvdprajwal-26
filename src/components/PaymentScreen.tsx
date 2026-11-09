import { t } from '@/i18n/translations';
import type { LanguageCode, Doctor, TierInfo } from '@/types';
import { ArrowLeft, Check, Loader2, Smartphone, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  lang: LanguageCode;
  doctor: Doctor;
  tier: TierInfo;
  phonePeOrderId?: string;
  onBack: () => void;
  onPaid: (method: PaymentMethod) => void;
}

type PaymentMethod = 'phonepe';
type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

type PaymentStartResponse = { redirectUrl?: string; merchantTransactionId?: string };
type PaymentStatusResponse = { status?: 'paid' | 'failed' | 'pending' };

export default function PaymentScreen({ lang, doctor, tier, phonePeOrderId, onBack, onPaid }: Props) {
  const [status, setStatus] = useState<PaymentStatus>(phonePeOrderId ? 'processing' : 'idle');
  const [message, setMessage] = useState('');
  const [statusCheckAttempt, setStatusCheckAttempt] = useState(0);

  useEffect(() => {
    if (!phonePeOrderId) return;
    let active = true;
    let successTimer: number | undefined;
    supabase.functions.invoke('phonepe-payment', { body: { action: 'status', merchantTransactionId: phonePeOrderId } }).then(({ data, error }) => {
      if (!active) return;
      const result = data as PaymentStatusResponse | null;
      if (error || !result?.status) {
        setStatus('error');
        setMessage('We could not confirm the PhonePe payment yet. Please try again.');
      } else if (result.status === 'paid') {
        setStatus('success');
        successTimer = window.setTimeout(() => onPaid('phonepe'), 900);
      } else if (result.status === 'failed') {
        setStatus('error');
        setMessage('PhonePe marked this payment as failed. Please start again.');
      } else {
        setStatus('error');
        setMessage('PhonePe is still processing this payment. Please try again shortly.');
      }
    });
    return () => {
      active = false;
      if (successTimer !== undefined) window.clearTimeout(successTimer);
    };
  }, [onPaid, phonePeOrderId, statusCheckAttempt]);

  const handlePay = async () => {
    if (status !== 'idle' && !(status === 'error' && !phonePeOrderId)) return;
    if (tier.price <= 0) {
      setStatus('error');
      setMessage('This doctor has not been given a price for this plan yet.');
      return;
    }
    setStatus('processing');
    setMessage('Opening secure PhonePe checkout…');
    const { data, error } = await supabase.functions.invoke('phonepe-payment', {
      body: { doctorProfileId: doctor.id, tierId: tier.id, returnUrl: `${window.location.origin}/?phonepe_return=1` },
    });
    const result = data as PaymentStartResponse | null;
    if (error || !result?.redirectUrl || !result.merchantTransactionId) {
      setStatus('error');
      setMessage('PhonePe could not start this payment. Please try again.');
      return;
    }
    sessionStorage.setItem('khbvd_phonepe_checkout', JSON.stringify({ doctor, tier }));
    window.location.assign(result.redirectUrl);
  };

  if (status === 'success') return <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/40 to-cyan-50/30 px-5"><div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-xl"><div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500"><Check className="h-9 w-9 text-white" strokeWidth={3} /></div><h2 className="text-xl font-bold text-slate-800">{t(lang, 'paymentSuccess')}</h2><p className="mt-2 text-sm text-slate-400">{t(lang, 'paymentSuccessMsg')}</p></div></main>;

  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/40 to-cyan-50/30">
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 backdrop-blur-lg"><div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-5"><button onClick={onBack} disabled={status === 'processing'} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100 disabled:opacity-40"><ArrowLeft className="h-5 w-5 text-slate-600" /></button><h1 className="text-base font-semibold text-slate-800">{t(lang, 'paymentTitle')}</h1></div></header>
    <div className="mx-auto max-w-md px-5 pb-16 pt-8"><div className="mb-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/40"><div className="mb-6 flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 font-bold text-white">{doctor.initials}</div><div><h3 className="text-sm font-semibold text-slate-800">{doctor.name}</h3><p className="text-xs text-slate-400">{doctor.specialty} · {doctor.location}</p></div></div><div className="mb-5 rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-slate-400">{tier.label}</p><p className="text-xs text-slate-400">{t(lang, 'pricePerSession')}</p></div><p className="text-2xl font-bold text-slate-800"><span className="text-sm font-normal text-slate-400">₹</span>{tier.price}</p></div></div><div className="flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800"><Smartphone className="h-5 w-5" /> Pay securely with PhonePe</div><div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-400"><Shield className="h-4 w-4 shrink-0 text-teal-500" /> Your payment is confirmed by PhonePe before the consultation starts.</div></div>{message && <p className={`mb-4 rounded-xl px-3 py-2.5 text-sm ${status === 'error' ? 'bg-red-50 text-red-700' : 'bg-teal-50 text-teal-800'}`}>{message}</p>}<button onClick={() => {
      if (status === 'error' && phonePeOrderId) {
        setMessage('Checking PhonePe…');
        setStatus('processing');
        setStatusCheckAttempt(previous => previous + 1);
      } else if (status === 'error') {
        setMessage('');
        void handlePay();
      } else {
        void handlePay();
      }
    }} disabled={status === 'processing'} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 py-4 font-semibold text-white shadow-lg transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">{status === 'processing' ? <><Loader2 className="h-5 w-5 animate-spin" /> Checking PhonePe…</> : status === 'error' ? phonePeOrderId ? 'Check payment status' : 'Try again' : <>Pay now · ₹{tier.price}</>}</button></div>
  </div>;
}
