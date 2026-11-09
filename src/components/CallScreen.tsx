import { useEffect, useState } from 'react';
import { Camera, CameraOff, Clock3, Mic, MicOff, PhoneOff, ShieldCheck, Volume2 } from 'lucide-react';
import type { Doctor, LanguageCode, TierInfo } from '@/types';

interface Props {
  doctor: Doctor;
  tier: TierInfo;
  lang: LanguageCode;
  onEnd: () => void;
}

export default function CallScreen({ doctor, tier, onEnd }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(tier.type !== 'video');
  const limit = tier.type === 'audio' ? 15 * 60 : 30 * 60;
  const isVideo = tier.type === 'video';

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(previous => Math.min(previous + 1, limit)), 1000);
    return () => window.clearInterval(timer);
  }, [limit]);

  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remaining = (seconds % 60).toString().padStart(2, '0');
  const remainingMinutes = Math.max(0, Math.ceil((limit - seconds) / 60));

  return <main className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950 text-white">
    {isVideo && !cameraOff && <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-cyan-950 to-slate-950"><div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 35%, #8be9ff 0, transparent 28%), linear-gradient(135deg, transparent 35%, #0f766e 36%, transparent 37%)' }} /></div>}
    <header className="relative z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-5 py-4 backdrop-blur-xl sm:px-8">
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 font-bold">{doctor.initials}</div><div><p className="font-semibold">{doctor.name}</p><p className="text-xs text-slate-300">{isVideo ? 'Secure video consultation' : 'Secure audio consultation'}</p></div></div>
      <div className="flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200"><ShieldCheck className="h-4 w-4" /> Demo session</div>
    </header>

    <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10">
      <div className="mb-8 text-center"><div className="mb-3 flex items-center justify-center gap-2 text-sm text-slate-300"><Clock3 className="h-4 w-4" /> Up to {isVideo ? '30' : '15'} min · {remainingMinutes} min remaining</div><p className="font-mono text-5xl font-semibold tracking-tight">{minutes}:{remaining}</p></div>
      <div className={`relative flex items-center justify-center rounded-[2.5rem] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/40 ${isVideo ? 'h-[min(58vh,520px)] w-full max-w-4xl' : 'h-72 w-72 rounded-full'}`}>
        {isVideo && !cameraOff ? <div className="absolute inset-0 flex items-end justify-center overflow-hidden rounded-[2.5rem] bg-gradient-to-t from-slate-950/80 to-transparent p-6"><div className="rounded-xl bg-slate-950/50 px-4 py-2 text-sm backdrop-blur">Live camera preview · {doctor.name}</div></div> : <div className="text-center"><div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 text-3xl font-bold shadow-xl shadow-cyan-500/20">{doctor.initials}</div><p className="font-medium">{doctor.name}</p><p className="mt-1 text-sm text-slate-400">{doctor.specialty}</p></div>}
        {!isVideo && <div className="absolute inset-8 rounded-full border border-cyan-300/20"><div className="absolute inset-0 flex items-center justify-center gap-1">{[14, 30, 20, 42, 24, 36, 18, 28, 44, 22, 34, 16].map((height, index) => <span key={index} className="w-1 rounded-full bg-cyan-300 animate-pulse" style={{ height, animationDelay: `${index * 90}ms` }} />)}</div></div>}
      </div>
    </section>

    <footer className="relative z-10 flex items-center justify-center gap-4 border-t border-white/10 bg-slate-950/70 px-5 py-6 backdrop-blur-xl">
      <button onClick={() => setMuted(previous => !previous)} className={`flex h-14 w-14 items-center justify-center rounded-full transition ${muted ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}>{muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>
      {isVideo && <button onClick={() => setCameraOff(previous => !previous)} className={`flex h-14 w-14 items-center justify-center rounded-full transition ${cameraOff ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'}`} aria-label={cameraOff ? 'Turn camera on' : 'Turn camera off'}>{cameraOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}</button>}
      <button className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:scale-105 hover:bg-red-600" onClick={onEnd} aria-label="End call"><PhoneOff className="h-6 w-6" /></button>
      <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Speaker"><Volume2 className="h-5 w-5" /></button>
    </footer>
  </main>;
}
