import { lazy, Suspense, useEffect, useState } from 'react';
import type { AppScreen, LanguageCode, Procedure, Doctor, TierInfo, UserProfile } from '@/types';
import { supabase } from '@/lib/supabase';

const AuthScreen = lazy(() => import('@/components/AuthScreen'));
const AdminLogin = lazy(() => import('@/components/AdminLogin'));
const DoctorDashboard = lazy(() => import('@/components/DoctorDashboard'));
const AdminDashboard = lazy(() => import('@/components/AdminDashboard'));
const LanguageScreen = lazy(() => import('@/components/LanguageScreen'));
const HomeScreen = lazy(() => import('@/components/HomeScreen'));
const DoctorsScreen = lazy(() => import('@/components/DoctorsScreen'));
const TriageScreen = lazy(() => import('@/components/TriageScreen'));
const PricingScreen = lazy(() => import('@/components/PricingScreen'));
const PaymentScreen = lazy(() => import('@/components/PaymentScreen'));
const ChatScreen = lazy(() => import('@/components/ChatScreen'));
const CallScreen = lazy(() => import('@/components/CallScreen'));
const EndScreen = lazy(() => import('@/components/EndScreen'));

function LoadingFallback() {
  return <div className="min-h-screen flex items-center justify-center bg-slate-950"><div className="flex flex-col items-center gap-3"><div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-teal-400" /><span className="text-xs font-medium tracking-[0.2em] text-slate-500">KHBV.D</span></div></div>;
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [screen, setScreen] = useState<AppScreen>('language');
  const [lang, setLang] = useState<LanguageCode>('en');
  const [procedure, setProcedure] = useState<Procedure | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [tier, setTier] = useState<TierInfo | null>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptomDuration, setSymptomDuration] = useState('');
  const [phonePeOrderId, setPhonePeOrderId] = useState<string | undefined>(() => new URLSearchParams(window.location.search).get('phonepe_order') ?? undefined);
  const adminRoute = window.location.pathname.startsWith('/admin');

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) { setCheckingSession(false); return; }
      const { data: savedProfile } = await supabase.from('profiles').select('id, username, role, full_name, age, gender, address, state, district, pincode, mobile_number').eq('id', data.session.user.id).maybeSingle();
      if (active && savedProfile) setProfile(savedProfile as UserProfile);
      if (active) setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (!session) setProfile(null); });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('phonepe_order');
    if (!orderId) return;
    const saved = sessionStorage.getItem('khbvd_phonepe_checkout');
    if (!saved) return;
    try {
      const checkout = JSON.parse(saved) as { doctor: Doctor; tier: TierInfo };
      setDoctor(checkout.doctor);
      setTier(checkout.tier);
      setPhonePeOrderId(orderId);
      setScreen('payment');
      sessionStorage.removeItem('khbvd_phonepe_checkout');
      window.history.replaceState({}, '', '/');
    } catch {
      sessionStorage.removeItem('khbvd_phonepe_checkout');
    }
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); setProfile(null); setScreen('language'); if (adminRoute) window.location.href = '/admin/login'; };
  const onAdminAuthenticated = (nextProfile: UserProfile) => { setProfile(nextProfile); window.history.replaceState({}, '', '/admin/dashboard'); };

  if (checkingSession) return <LoadingFallback />;

  const content = (() => {
    if (adminRoute && (!profile || profile.role !== 'admin')) return <AdminLogin onAuthenticated={onAdminAuthenticated} />;
    if (!profile) return <AuthScreen onAuthenticated={nextProfile => { setProfile(nextProfile); setScreen('language'); }} />;
    if (profile.role === 'admin') return <AdminDashboard profile={profile} onLogout={handleLogout} />;
    if (profile.role === 'doctor') return <DoctorDashboard profile={profile} onLogout={handleLogout} />;

    const handleLanguageContinue = (selected: LanguageCode) => { setLang(selected); setScreen('home'); };
    const handleSelectProcedure = (proc: Procedure) => { setProcedure(proc); setScreen('doctors'); };
    const handleSelectDoctor = (doc: Doctor) => { setDoctor(doc); setScreen('triage'); };
    const handleSelectTier = (selectedTier: TierInfo) => { setTier(selectedTier); setScreen('payment'); };
    const handlePaid = (method: string) => { void method; setPhonePeOrderId(undefined); setScreen(tier?.type === 'text' ? 'chat' : 'call'); };
    const handleGoHome = () => { setProcedure(null); setDoctor(null); setTier(null); setChiefComplaint(''); setSymptomDuration(''); setScreen('home'); };

    switch (screen) {
      case 'language': return <LanguageScreen onContinue={handleLanguageContinue} />;
      case 'home': return <HomeScreen lang={lang} userName={profile.full_name} userId={profile.id} userRole={profile.role} onSelectProcedure={handleSelectProcedure} onChangeLanguage={() => setScreen('language')} onLogout={handleLogout} />;
      case 'doctors': return procedure ? <DoctorsScreen lang={lang} procedure={procedure} onBack={() => setScreen('home')} onSelectDoctor={handleSelectDoctor} /> : null;
      case 'triage': return doctor ? <TriageScreen lang={lang} doctor={doctor} onBack={() => setScreen('doctors')} onContinue={(complaint, duration) => { setChiefComplaint(complaint); setSymptomDuration(duration); setScreen('pricing'); }} /> : null;
      case 'pricing': return doctor ? <PricingScreen lang={lang} doctor={doctor} onBack={() => setScreen('triage')} onSelectTier={handleSelectTier} /> : null;
      case 'payment': return doctor && tier ? <PaymentScreen lang={lang} doctor={doctor} tier={tier} phonePeOrderId={phonePeOrderId} onBack={() => setScreen('pricing')} onPaid={handlePaid} /> : null;
      case 'call': return doctor && tier ? <CallScreen lang={lang} doctor={doctor} tier={tier} onEnd={() => setScreen('ended')} /> : null;
      case 'chat': return doctor && tier ? <ChatScreen lang={lang} doctor={doctor} tier={tier} chiefComplaint={chiefComplaint} symptomDuration={symptomDuration} onBack={() => setScreen('payment')} onEnd={() => setScreen('ended')} /> : null;
      case 'ended': return doctor ? <EndScreen lang={lang} doctorName={doctor.name} onHome={handleGoHome} /> : null;
      default: return null;
    }
  })();

  return <Suspense fallback={<LoadingFallback />}>{content}</Suspense>;
}
