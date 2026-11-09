import { FormEvent, useState } from 'react';
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';
import BrandLogo from '@/components/BrandLogo';

interface Props { onAuthenticated: (profile: UserProfile) => void; }

const ADMIN_USERNAME = 'KHBV.DPrajwaladmin-15';

function normalizeAdminUsername(username: string): string { return username.replace(/\s/g, '').replace(/_/g, '-'); }
function accountEmail(username: string): string { return `${normalizeAdminUsername(username).toLowerCase()}@khbvd.app`; }

export default function AdminLogin({ onAuthenticated }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (normalizeAdminUsername(username) !== ADMIN_USERNAME || password.length < 8) { setError('Access denied. Check your administrator credentials.'); return; }
    setBusy(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: accountEmail(username.trim()), password });
      if (signInError || !data.user) throw new Error('invalid admin sign in');
      const { data: profile } = await supabase.from('profiles').select('id, username, role, full_name, age, gender, address, state, district, pincode, mobile_number').eq('id', data.user.id).maybeSingle();
      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('administrator access required');
      }
      onAuthenticated(profile as UserProfile);
    } catch (cause) {
      console.error('admin sign in failed', cause);
      setError('Access denied. Check your administrator credentials.');
    } finally { setBusy(false); }
  };

  return <main className="auth-shell min-h-screen px-5 py-8">
    <div className="luxury-glow luxury-glow-one" /><div className="luxury-glow luxury-glow-two" />
    <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center">
      <section className="auth-card w-full rounded-[2rem] p-7 sm:p-9">
        <div className="mb-9 flex items-start justify-between"><BrandLogo /><div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><LockKeyhole className="h-5 w-5" /></div></div>
        <div className="mb-7"><p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.22em] text-teal-700"><ShieldCheck className="h-4 w-4" /> Private access</p><h1 className="font-serif text-4xl italic text-slate-900">Admin sign in</h1><p className="mt-3 text-sm leading-relaxed text-slate-500">This entrance is reserved for authorized KHBV.D administrators. There is no public administrator registration.</p></div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Admin username</span><input className="field" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="Enter username" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Password</span><input className="field" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Enter password" /></label>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
          <button className="primary-button mt-2 w-full" disabled={busy}>{busy ? 'Checking access…' : 'Enter admin dashboard'}</button>
        </form>
        <button onClick={() => { window.location.href = '/'; }} className="mt-6 flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-700"><ArrowLeft className="h-4 w-4" /> Return to patient and doctor sign in</button>
      </section>
    </div>
  </main>;
}
