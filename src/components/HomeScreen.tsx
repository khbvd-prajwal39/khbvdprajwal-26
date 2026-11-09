import { PROCEDURES, VET_PROCEDURES } from '@/data/procedures';
import AssistantWidget from '@/components/AssistantWidget';
import BrandLogo from '@/components/BrandLogo';
import { t } from '@/i18n/translations';
import type { LanguageCode, Procedure } from '@/types';
import {
  Sparkles, Bone, AlignHorizontalJustifyCenter, Sun, Wind, Activity, Syringe, Smile, PawPrint, Milk,
  Stethoscope, Search, Star, ChevronRight, Globe, Menu, X, ReceiptText, Users, HelpCircle, LogOut, UserCircle,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { TourGate, type TourStep } from '@/components/GuidedTour';
import { supabase } from '@/lib/supabase';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Bone, AlignHorizontalJustifyCenter, Sun, Wind, Activity, Syringe, Smile, PawPrint, Milk,
};

interface Props {
  lang: LanguageCode;
  userName: string;
  userId: string;
  userRole: 'doctor' | 'patient';
  onSelectProcedure: (procedure: Procedure) => void;
  onChangeLanguage: () => void;
  onLogout: () => void;
}

interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  doctor_id: string | null;
}

interface DirectoryDoctor {
  id: string;
  full_name: string;
  specialty: string;
}

export default function HomeScreen({ lang, userName, userId, userRole, onSelectProcedure, onChangeLanguage, onLogout }: Props) {
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<'transactions' | 'doctors' | 'support' | null>(null);
  const [supportCategory, setSupportCategory] = useState('consultation');
  const [supportDescription, setSupportDescription] = useState('');
  const [supportNotice, setSupportNotice] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [directoryDoctors, setDirectoryDoctors] = useState<DirectoryDoctor[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const filtered = useMemo(() => {
    if (!search) return PROCEDURES;
    return PROCEDURES.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  useEffect(() => {
    if (panel !== 'transactions' && panel !== 'doctors') return;
    let active = true;
    setHistoryLoading(true);
    setHistoryError('');

    const loadHistory = async () => {
      const { data: payments, error: paymentError } = await supabase
        .from('payment_records')
        .select('id, amount, status, payment_method, created_at, doctor_id')
        .eq('patient_id', userId)
        .order('created_at', { ascending: false });

      if (!active) return;
      if (paymentError) {
        setHistoryError('Could not load your payment history. Please try again.');
        setHistoryLoading(false);
        return;
      }

      setPaymentHistory((payments ?? []) as PaymentHistoryItem[]);
      if (panel === 'doctors') {
        const { data: doctors, error: doctorsError } = await supabase.rpc('list_khbvd_approved_doctors');
        if (!active) return;
        if (doctorsError) {
          setHistoryError('Could not load your doctor history. Please try again.');
        } else {
          setDirectoryDoctors((doctors ?? []) as DirectoryDoctor[]);
        }
      }
      setHistoryLoading(false);
    };

    void loadHistory();
    return () => { active = false; };
  }, [panel, userId]);

  const mostUsedDoctors = useMemo(() => {
    const uses = new Map<string, number>();
    for (const payment of paymentHistory) {
      if (payment.status === 'paid' && payment.doctor_id) {
        uses.set(payment.doctor_id, (uses.get(payment.doctor_id) ?? 0) + 1);
      }
    }
    return [...uses.entries()]
      .map(([id, count]) => ({ doctor: directoryDoctors.find(item => item.id === id), count }))
      .filter((item): item is { doctor: DirectoryDoctor; count: number } => Boolean(item.doctor))
      .sort((left, right) => right.count - left.count);
  }, [directoryDoctors, paymentHistory]);

  const TOUR_STEPS: TourStep[] = [
    { selector: '[data-tour="menu"]', title: 'Navigation Menu', description: 'Tap the menu icon to access your transactions, most-used doctors, help, and logout.' },
    { selector: '[data-tour="search"]', title: 'Search Procedures', description: 'Type the name of a procedure or specialty to quickly find what you need.' },
    { selector: '[data-tour="procedures"]', title: 'Medical Procedures', description: 'Browse all available procedures. Tap any card to see available doctors and start a consultation.' },
    { selector: '[data-tour="veterinary"]', title: 'Veterinary Care', description: 'Tap here if you need a vet for your pets, cows, or farm animals.' },
    { selector: '[data-tour="assistant"]', title: 'KHBV.D Assistant', description: 'Tap the assistant button anytime to describe symptoms by voice or text in any language. It will recommend the right doctor.' },
    { selector: '[data-tour="language"]', title: 'Change Language', description: 'Switch the app language anytime from here.' },
  ];

  return (
    <TourGate tourKey="khbvd_home_tour" steps={TOUR_STEPS}>
    <div className="luxury-bg min-h-screen">
      <div className="luxury-content">
      <header className="sticky top-0 z-20 bg-white/10 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button data-tour="menu" onClick={() => setMenuOpen(true)} className="rounded-xl p-2 text-white/80 hover:bg-white/10" aria-label="Open navigation menu"><Menu className="h-5 w-5" /></button>
            <BrandLogo compact />
            <div className="hidden sm:block"><p className="font-bold text-white">KHBV.D</p><p className="text-[10px] tracking-wide text-slate-300">Doctors consultation & services</p></div>
          </div>
          <div className="flex items-center gap-2"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-white">{userName}</p><p className="text-[11px] capitalize text-slate-300">{userRole}</p></div><button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-amber-200" aria-label="Profile"><UserCircle className="h-5 w-5" /></button><button data-tour="language" onClick={onChangeLanguage} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors"><Globe className="w-4 h-4" /><span className="font-medium">{t(lang, 'changeLanguage')}</span></button></div>
        </div>
      </header>

      {menuOpen && <div className="fixed inset-0 z-30 bg-slate-950/30" onClick={() => setMenuOpen(false)}><aside className="h-full w-80 max-w-[86vw] bg-white p-5 shadow-2xl" onClick={e => e.stopPropagation()}><div className="mb-8 flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><UserCircle className="h-6 w-6" /></div><div><p className="font-semibold text-slate-800">{userName}</p><p className="text-xs capitalize text-slate-400">{userRole}</p></div></div><button onClick={() => setMenuOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><nav className="space-y-2"><button onClick={() => { setPanel('transactions'); setMenuOpen(false); }} className="menu-item"><ReceiptText className="h-5 w-5" />Transactions</button><button onClick={() => { setPanel('doctors'); setMenuOpen(false); }} className="menu-item"><Users className="h-5 w-5" />Most used doctors</button><button onClick={() => { setPanel('support'); setMenuOpen(false); }} className="menu-item"><HelpCircle className="h-5 w-5" />Help and support</button><button onClick={onLogout} className="menu-item menu-item-danger"><LogOut className="h-5 w-5" />Log out</button></nav></aside></div>}

      {panel && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-slate-950/30 p-4 sm:items-center" onClick={() => setPanel(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">{panel === 'transactions' ? 'Transactions' : panel === 'doctors' ? 'Most used doctors' : 'Help and support'}</h2>
              <button onClick={() => setPanel(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close panel"><X className="h-5 w-5" /></button>
            </div>
            {panel === 'transactions' && (
              historyLoading ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Loading transactions…</p> :
              historyError ? <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{historyError}</p> :
              paymentHistory.length ? <div className="max-h-[60vh] space-y-3 overflow-y-auto">
                {paymentHistory.map(payment => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                    <div className="min-w-0">
                      <p className="font-semibold capitalize text-slate-700">{payment.payment_method.replace(/_/g, ' ')} · {payment.status}</p>
                      <p className="mt-1 text-xs text-slate-400">{new Date(payment.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className="shrink-0 font-semibold text-slate-800">₹{Number(payment.amount).toFixed(2)}</p>
                  </div>
                ))}
              </div> : <p className="rounded-2xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-500">No transactions yet.</p>
            )}
            {panel === 'doctors' && (
              historyLoading ? <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Loading doctors…</p> :
              historyError ? <p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">{historyError}</p> :
              mostUsedDoctors.length ? <div className="max-h-[60vh] space-y-3 overflow-y-auto">
                {mostUsedDoctors.map(({ doctor, count }) => (
                  <div key={doctor.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                    <div className="min-w-0"><p className="truncate font-semibold text-slate-700">{doctor.full_name}</p><p className="text-xs text-slate-400">{doctor.specialty}</p></div>
                    <span className="shrink-0 text-xs font-medium text-teal-700">{count} {count === 1 ? 'consultation' : 'consultations'}</span>
                  </div>
                ))}
              </div> : <p className="rounded-2xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-500">Your doctors will appear here after a completed payment.</p>
            )}
            {panel === 'support' && <div className="space-y-3 text-sm text-slate-600"><p>Need help with a consultation, payment, or your account?</p><select className="field" value={supportCategory} onChange={event => setSupportCategory(event.target.value)}><option value="consultation">Consultation</option><option value="payment">Payment</option><option value="account">Account</option><option value="technical">Technical issue</option><option value="other">Other</option></select><textarea className="field min-h-28 resize-none" placeholder="Describe how we can help" value={supportDescription} onChange={event => setSupportDescription(event.target.value)} />{supportNotice && <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-800">{supportNotice}</p>}<button onClick={async () => { if (supportDescription.trim().length < 1) { setSupportNotice('Please describe the issue first.'); return; } const { error } = await supabase.from('support_requests').insert({ requester_id: userId, issue_category: supportCategory, issue_description: supportDescription.trim() }); if (error) { console.error('support request failed', error); setSupportNotice('Could not send your request. Please try again.'); } else { setSupportDescription(''); setSupportNotice('Your request has been sent to the support team.'); } }} className="primary-button w-full">Send support request</button></div>}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-5 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">{t(lang, 'proceduresTitle')}</h1>
          <p className="text-slate-300 mt-1.5">{t(lang, 'proceduresSubtitle')}</p>
        </div>

        <div data-tour="search" className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t(lang, 'searchProcedure')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm"
          />
        </div>

        <div data-tour="procedures" className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wide">{t(lang, 'popularProcedures')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(procedure => {
            const Icon = ICON_MAP[procedure.icon] || Stethoscope;
            const onlineCount = procedure.doctors.filter(d => d.status === 'online').length;
            return (
              <button
                key={procedure.id}
                onClick={() => onSelectProcedure(procedure)}
                className="group bg-white rounded-2xl p-5 border border-slate-100 text-left hover:border-teal-200 hover:shadow-lg hover:shadow-teal-100/50 transition-all active:scale-[0.99]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl flex items-center justify-center group-hover:from-teal-100 group-hover:to-cyan-100 transition-colors">
                    <Icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-slate-500 font-medium">{onlineCount} {t(lang, 'online')}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800 text-base mb-1">{procedure.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{procedure.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">{procedure.category}</span>
                  <div className="flex items-center gap-1 text-slate-400 group-hover:text-teal-600 transition-colors">
                    <span className="text-xs font-medium">{procedure.doctors.length} {t(lang, 'findDoctors')}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div data-tour="veterinary" className="mt-10 flex items-center gap-2 mb-4"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /><h2 className="text-sm font-semibold text-amber-200 uppercase tracking-wide">Veterinary care</h2></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{VET_PROCEDURES.map(procedure => { const Icon = ICON_MAP[procedure.icon] || Stethoscope; return <button key={procedure.id} onClick={() => onSelectProcedure(procedure)} className="group bg-[#102b38] rounded-2xl p-5 text-left text-white hover:shadow-xl hover:shadow-slate-300/50 transition-all"><div className="mb-3 flex items-start justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10"><Icon className="h-6 w-6 text-amber-300" /></div><span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-amber-100">{procedure.category}</span></div><h3 className="mb-1 font-semibold">{procedure.name}</h3><p className="text-xs text-slate-300">{procedure.description}</p><div className="mt-4 flex items-center justify-between text-xs text-teal-100"><span>{procedure.doctors.length} doctors</span><ChevronRight className="h-4 w-4" /></div></button>; })}</div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-sm">No procedures found</p>
          </div>
        )}
      </div>
      <div data-tour="assistant"><AssistantWidget doctors={[...PROCEDURES, ...VET_PROCEDURES].flatMap(item => item.doctors)} lang={lang} /></div>
      </div>
    </div>
    </TourGate>
  );
}
