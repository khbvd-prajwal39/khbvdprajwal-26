interface Props { compact?: boolean; light?: boolean; }

export default function BrandLogo({ compact = false, light = false }: Props) {
  return <div className="flex items-center gap-3"><img src="/Screenshot_2026-10-05_194625.png" alt="KHBV.D logo" className={`h-11 w-11 rounded-2xl object-contain bg-black shadow-lg ${light ? 'ring-1 ring-blue-200/50' : 'ring-1 ring-blue-100'}`} />{!compact && <div><p className={`font-serif text-2xl font-semibold tracking-[.12em] ${light ? 'text-white' : 'text-slate-900'}`}>KHBV.D</p><p className={`text-[9px] uppercase tracking-[.22em] ${light ? 'text-blue-100/80' : 'text-slate-400'}`}>Doctors consultation & services</p></div>}</div>;
}
