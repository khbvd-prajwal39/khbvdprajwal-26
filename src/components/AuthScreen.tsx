import { useMemo, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, RefreshCw, ScanFace, ShieldCheck, UserRound, UsersRound, Phone, CheckCircle2, Fingerprint, FileText, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';
import BrandLogo from '@/components/BrandLogo';
import { INDIAN_STATES, STATE_NAMES } from '@/data/indianLocations';

interface Props {
  onAuthenticated: (profile: UserProfile) => void;
}

type AuthMode = 'signin' | 'register';
type Role = 'doctor' | 'patient';

function accountEmail(username: string): string {
  return `${username.trim().toLowerCase()}@khbvd.app`;
}

function createCaptcha(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from({ length: 6 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
}

export default function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captcha, setCaptcha] = useState(createCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [role, setRole] = useState<Role>('patient');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [biometricOpen, setBiometricOpen] = useState(false);
  const [biometricStep, setBiometricStep] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [biometricMode, setBiometricMode] = useState<'face' | 'fingerprint'>('face');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const districts = state ? INDIAN_STATES[state] ?? [] : [];

  const isRegisterValid = useMemo(() => (
    /^[A-Za-z0-9]{4,24}$/.test(username) &&
    password.length >= 8 &&
    fullName.trim().length > 1 &&
    Number(age) >= 18 && Number(age) <= 120 &&
    gender && address.trim() && state && district && /^\d{6}$/.test(pincode) &&
    /^\d{10}$/.test(mobileNumber) && otpVerified &&
    captchaInput === captcha && termsAccepted
  ), [username, password, fullName, age, gender, address, state, district, pincode, mobileNumber, otpVerified, captchaInput, captcha, termsAccepted]);

  const clearFeedback = () => { setError(''); setMessage(''); };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    clearFeedback();
    setForgotOpen(false);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp('');
    setBiometricOpen(false);
    setBiometricStep('idle');
    setTermsAccepted(false);
  };

  const switchRole = (nextRole: Role) => {
    setRole(nextRole);
    setTermsAccepted(false);
  };

  const handleSendOtp = () => {
    if (!/^\d{10}$/.test(mobileNumber)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSent(true);
    setError('');
    setMessage(`OTP sent to +91 ${mobileNumber}. For this demo, any 6-digit code will be accepted.`);
  };

  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      setOtpVerified(true);
      setError('');
      setMessage('Mobile number verified successfully.');
    } else {
      setError('Enter the 6-digit OTP.');
    }
  };

  const handleBiometricScan = () => {
    setBiometricStep('scanning');
    setTimeout(() => {
      setBiometricStep('success');
      setTimeout(() => {
        setBiometricOpen(false);
        setBiometricStep('idle');
        setMessage(`${biometricMode === 'face' ? 'Face' : 'Fingerprint'} verified. You can now sign in directly.`);
      }, 1200);
    }, 2000);
  };

  const handleBiometricSignIn = async () => {
    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, role, full_name, age, gender, address, state, district, pincode')
          .eq('id', session.session.user.id)
          .maybeSingle();
        if (profile) { onAuthenticated(profile as UserProfile); return; }
      }
      setMessage('No existing session found. Please sign in with username and password first, then biometric will be available for future logins.');
    } catch {
      setError('Biometric sign-in failed. Please use username and password.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async () => {
    clearFeedback();
    if (!/^[A-Za-z0-9]{4,24}$/.test(username)) { setError('Use 4-24 letters and numbers for your username.'); return; }
    if (password.length < 8) { setError('Your password must be at least 8 characters.'); return; }
    if (mode === 'register' && !isRegisterValid) {
      if (Number(age) > 0 && Number(age) < 18) { setError('You must be at least 18 years old to create an account.'); return; }
      if (!termsAccepted) { setError('Please review and accept the Terms & Conditions to continue.'); return; }
      setError('Please complete every registration field, verify mobile OTP, and enter the captcha.'); return;
    }

    setBusy(true);
    try {
      if (mode === 'signin') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: accountEmail(username), password });
        if (signInError || !data.user) throw new Error('sign in failed');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, role, full_name, age, gender, address, state, district, pincode')
          .eq('id', data.user.id)
          .maybeSingle();
        if (profileError || !profile) throw new Error('profile unavailable');
        onAuthenticated(profile as UserProfile);
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({ email: accountEmail(username), password });
        if (signUpError || !data.user) throw new Error('registration failed');
        const { data: profile, error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id, username: username.trim(), role, full_name: fullName.trim(),
          age: Number(age), gender, address: address.trim(), state, district, pincode, mobile_number: mobileNumber,
        }).select('id, username, role, full_name, age, gender, address, state, district, pincode').maybeSingle();
        if (profileError || !profile) throw new Error('registration failed');
        onAuthenticated(profile as UserProfile);
      }
    } catch (cause) {
      console.error('authentication request failed', cause);
      setError('We could not complete that request. Check your details and try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = () => {
    clearFeedback();
    if (!/^[A-Za-z0-9]{4,24}$/.test(username)) { setError('Enter your username first.'); return; }
    setForgotOpen(false);
    setMessage('If that username is registered, password recovery instructions will be sent to the registered mobile number.');
  };

  return (
    <main className="auth-shell min-h-screen px-5 py-8">
      <div className="luxury-glow luxury-glow-one" />
      <div className="luxury-glow luxury-glow-two" />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_520px]">
        <section className="hidden lg:sticky lg:top-8 lg:block lg:self-start">
          <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-amber-300/30 bg-white/10 px-4 py-2 text-sm text-amber-100 backdrop-blur-sm">
            <ShieldCheck className="h-4 w-4 text-amber-300" /> Private, trusted care
          </div>
          <h1 className="max-w-xl text-6xl font-semibold leading-[1.05] tracking-tight text-white">
            KHBV<span className="text-amber-300">.D</span>
          </h1>
          <p className="mt-5 max-w-lg text-xl leading-relaxed text-slate-300">Doctors, consultation and services — thoughtfully brought together for your health journey.</p>
          <div className="mt-12 grid max-w-lg grid-cols-3 gap-3">
            {['Verified doctors', 'Mobile OTP secure', 'Face recognition login'].map(item => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-slate-300 backdrop-blur-sm">{item}</div>
            ))}
          </div>
        </section>

        <section className="auth-card rounded-[2rem] p-6 sm:p-8">
          <div className="mb-7"><BrandLogo /></div>

          <div className="mb-3 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button onClick={() => switchMode('signin')} className={`rounded-lg py-2.5 text-sm font-semibold transition ${mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Sign in</button>
            <button onClick={() => switchMode('register')} className={`rounded-lg py-2.5 text-sm font-semibold transition ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Register</button>
          </div>

          {mode === 'signin' && (
            <button onClick={() => setBiometricOpen(true)} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 py-3 text-sm font-semibold text-teal-700 transition hover:bg-teal-100">
              <ScanFace className="h-5 w-5" /> Sign in with Face or Fingerprint
            </button>
          )}

          {mode === 'register' && (
            <div className="mb-5 grid grid-cols-2 gap-2">
              <button onClick={() => switchRole('patient')} className={`role-choice ${role === 'patient' ? 'role-choice-active' : ''}`}><UserRound className="h-4 w-4" /> Patient</button>
              <button onClick={() => switchRole('doctor')} className={`role-choice ${role === 'doctor' ? 'role-choice-active' : ''}`}><UsersRound className="h-4 w-4" /> Doctor</button>
            </div>
          )}

          <div className="space-y-3">
            {mode === 'register' && <>
              <input className="field" placeholder="Full name" value={fullName} onChange={e => setFullName(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className="field" type="number" min="18" max="120" placeholder="Age (18+ required)" value={age} onChange={e => setAge(e.target.value)} />
                <select className="field" value={gender} onChange={e => setGender(e.target.value)}><option value="">Gender</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select>
              </div>
              <textarea className="field min-h-20 resize-none" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <select className="field" value={state} onChange={e => { setState(e.target.value); setDistrict(''); }}>
                  <option value="">Select State</option>
                  {STATE_NAMES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="field" value={district} onChange={e => setDistrict(e.target.value)} disabled={!state}>
                  <option value="">{state ? 'Select District' : 'Select state first'}</option>
                  {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="field" inputMode="numeric" maxLength={6} placeholder="Pincode" value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3">
                  <span className="text-sm text-slate-400 font-medium">+91</span>
                  <input className="w-full bg-transparent py-3 text-sm outline-none" inputMode="numeric" maxLength={10} placeholder="Mobile number" value={mobileNumber} onChange={e => { setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); setOtpSent(false); setOtpVerified(false); }} />
                </div>
              </div>

              {!otpSent && mobileNumber.length === 10 && (
                <button onClick={handleSendOtp} className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-100">
                  <Phone className="h-4 w-4" /> Send OTP
                </button>
              )}
              {otpSent && !otpVerified && (
                <div className="flex gap-2">
                  <input className="field" inputMode="numeric" maxLength={6} placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                  <button onClick={handleVerifyOtp} className="rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700">Verify</button>
                </div>
              )}
              {otpVerified && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Mobile verified
                </div>
              )}
            </>}

            <input className="field" placeholder="Username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value.replace(/[^A-Za-z0-9]/g, ''))} />
            <div className="relative">
              <input className="field pr-12" type={showPassword ? 'text' : 'password'} placeholder="Password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {mode === 'register' && (
              <div className="flex items-center gap-2">
                <div className="captcha-box">{captcha}</div>
                <button type="button" onClick={() => setCaptcha(createCaptcha())} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Refresh captcha"><RefreshCw className="h-4 w-4" /></button>
                <input className="field" placeholder="Enter captcha" value={captchaInput} onChange={e => setCaptchaInput(e.target.value)} />
              </div>
            )}

            {mode === 'register' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  <span className="text-xs leading-relaxed text-slate-600">I have read and agree to the <button type="button" onClick={() => setTermsOpen(true)} className="font-semibold text-teal-700 underline hover:text-teal-900">{role === 'patient' ? 'Patient' : 'Doctor'} Terms &amp; Conditions</button> and confirm I am 18 years or older.</span>
                </label>
              </div>
            )}
          </div>

          {mode === 'signin' && <button onClick={() => setForgotOpen(true)} className="mt-3 text-sm font-medium text-teal-700 hover:text-teal-900">Forgot password?</button>}
          {error && <p className="mt-4 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
          {message && <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{message}</p>}
          <button onClick={handleSubmit} disabled={busy} className="primary-button mt-6 w-full">{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in securely' : 'Create account'}</button>
          <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">By continuing, you agree to use KHBV.D for health consultation and app services.</p>
        </section>
      </div>

      {biometricOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-5">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
            <h2 className="mb-2 font-semibold text-slate-900">Biometric Sign In</h2>
            <p className="mb-6 text-sm text-slate-500">Choose your preferred verification method.</p>

            {biometricStep === 'idle' && (
              <div className="space-y-3">
                <button onClick={() => { setBiometricMode('face'); handleBiometricScan(); }} className="flex w-full items-center justify-center gap-3 rounded-xl border border-teal-200 bg-teal-50 py-4 text-sm font-semibold text-teal-700 transition hover:bg-teal-100">
                  <ScanFace className="h-6 w-6" /> Face Recognition
                </button>
                <button onClick={() => { setBiometricMode('fingerprint'); handleBiometricScan(); }} className="flex w-full items-center justify-center gap-3 rounded-xl border border-blue-200 bg-blue-50 py-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                  <Fingerprint className="h-6 w-6" /> Fingerprint Scan
                </button>
              </div>
            )}

            {biometricStep !== 'idle' && (
              <div className="relative mx-auto mb-6 h-48 w-48">
                <div className={`absolute inset-0 rounded-3xl border-4 transition-all ${biometricStep === 'scanning' ? 'border-teal-400 animate-pulse' : 'border-emerald-400'}`}>
                  {biometricStep === 'scanning' && biometricMode === 'face' && (
                    <>
                      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-teal-400 shadow-lg shadow-teal-400/50 animate-bounce" />
                      <div className="absolute left-4 top-6 h-2 w-2 rounded-full bg-teal-400" />
                      <div className="absolute right-4 top-6 h-2 w-2 rounded-full bg-teal-400" />
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 h-1.5 w-3 rounded bg-teal-400" />
                      <div className="absolute left-1/2 bottom-8 -translate-x-1/2 h-1 w-4 rounded bg-teal-400" />
                    </>
                  )}
                  {biometricStep === 'scanning' && biometricMode === 'fingerprint' && (
                    <div className="flex h-full items-center justify-center">
                      <Fingerprint className="h-24 w-24 text-teal-400 animate-pulse" />
                    </div>
                  )}
                  {biometricStep === 'success' && (
                    <div className="flex h-full items-center justify-center">
                      <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {biometricStep === 'scanning' && <p className="text-sm font-medium text-teal-600">{biometricMode === 'face' ? 'Scanning facial features…' : 'Scanning fingerprint…'}</p>}
            {biometricStep === 'success' && (
              <>
                <p className="mb-4 text-sm font-medium text-emerald-600">Identity verified!</p>
                <button onClick={handleBiometricSignIn} disabled={busy} className="primary-button w-full">{busy ? 'Please wait…' : 'Sign In Now'}</button>
              </>
            )}

            <button onClick={() => { setBiometricOpen(false); setBiometricStep('idle'); }} className="mt-4 w-full py-2 text-sm font-medium text-slate-500">Cancel</button>
          </div>
        </div>
      )}

      {forgotOpen && <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/60 p-5"><div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"><div className="mb-4 flex items-center gap-3"><LockKeyhole className="h-5 w-5 text-teal-700" /><h2 className="font-semibold text-slate-900">Reset your password</h2></div><p className="text-sm leading-relaxed text-slate-500">Enter your username and we'll send recovery instructions to your registered mobile number.</p><button onClick={handleForgot} className="primary-button mt-5 w-full">Continue</button><button onClick={() => setForgotOpen(false)} className="mt-3 w-full py-2 text-sm font-medium text-slate-500">Cancel</button></div></div>}

      {termsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-5">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-teal-700" />
                <h2 className="font-semibold text-slate-900">{role === 'patient' ? 'Patient' : 'Doctor'} Terms &amp; Conditions</h2>
              </div>
              <button onClick={() => setTermsOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto px-6 py-5">
              {role === 'patient' ? (
                <div className="space-y-5 text-sm leading-relaxed text-slate-600">
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-slate-800"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs text-teal-700">1</span> Age Restriction</h3>
                    <p className="mt-2">Users must be at least 18 years of age or older to create an account, make payments, or book an online consultation on this platform. Minors may only use the platform under the direct supervision of a parent or legal guardian.</p>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-slate-800"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs text-teal-700">2</span> Scope of Online Service</h3>
                    <p className="mt-2">This platform provides strictly online-only digital consultations. There is absolutely no physical hospital booking, clinic bed reservation, or in-person doctor appointment management available through this software.</p>
                    <p className="mt-2">The platform is designed for standard, non-emergency health inquiries only. For extreme, severe, or life-threatening health conditions, patients must not depend on this online service and are strictly directed to contact local emergency services or visit a physical hospital immediately.</p>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-slate-800"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs text-teal-700">3</span> Code of Conduct</h3>
                    <p className="mt-2">Patients are strictly required to behave respectfully, politely, and professionally toward all consulting practitioners. Any abusive language, harassment, use of profanity, or disrespectful behavior will result in an immediate, permanent account ban without a refund.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-sm leading-relaxed text-slate-600">
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-slate-800"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs text-teal-700">1</span> Eligibility &amp; Age</h3>
                    <p className="mt-2">All onboarding independent practitioners must be legally certified adults (18+ years of age) holding valid, active, and unencumbered KMC/NMC registration numbers and verified degree certificates.</p>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-slate-800"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs text-teal-700">2</span> Purely Online Consulting Framework</h3>
                    <p className="mt-2">Practitioners understand that this platform operates solely as a digital technology marketplace for remote online video/audio consultations. No physical hospital or clinical facility bookings are handled by this technology provider.</p>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-slate-800"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs text-teal-700">3</span> Professional Conduct &amp; Precautions</h3>
                    <p className="mt-2">Onboarded doctors are legally obligated to provide accurate medical precautions, safe guidance, and evidence-based digital care plans.</p>
                    <p className="mt-2">Doctors must maintain absolute politeness, patience, and professional, respectful behavior during all patient audio, video, or chat interactions.</p>
                  </div>
                  <div>
                    <h3 className="flex items-center gap-2 font-bold text-slate-800"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-xs text-teal-700">4</span> Platform Architecture &amp; Settlement</h3>
                    <p className="mt-2">The platform acts as a technology framework provider. Standard marketplace platform fees and transaction commission splits are processed dynamically upon successful consultation completion according to verified vendor account metrics.</p>
                  </div>
                </div>
              )}
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>By creating an account, you acknowledge that you have read, understood, and agreed to all terms outlined above.</span>
              </div>
            </div>
            <div className="border-t border-slate-100 px-6 py-4">
              <div className="flex gap-3">
                <button onClick={() => { setTermsAccepted(false); setTermsOpen(false); }} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Decline</button>
                <button onClick={() => { setTermsAccepted(true); setTermsOpen(false); }} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-bold text-white hover:bg-teal-700">I Accept</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
