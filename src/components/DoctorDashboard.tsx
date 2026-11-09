import { useEffect, useState } from 'react';
import { CheckCircle2, FileImage, LogOut, UploadCloud } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { UserProfile, DoctorCertificate, CertificateType } from '@/types';
import BrandLogo from '@/components/BrandLogo';
import CertificateChain from '@/components/CertificateChain';

interface Props { profile: UserProfile; onLogout: () => void; }
type Category = 'human' | 'veterinary';

const emptyForm = { degree: '', registration_number: '', specialty: 'General Medicine', doctor_category: 'human' as Category, animal_specialty: '', district: '', city: '', pincode: '', clinic_address: '', clinic_timings: '', online_slots: '', years_experience: '0', certificate_link: '', short_bio: '' };

export default function DoctorDashboard({ profile, onLogout }: Props) {
  const [form, setForm] = useState({ ...emptyForm, district: profile.district, city: profile.district });
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'new' | 'pending' | 'approved' | 'rejected'>('new');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<DoctorCertificate[]>([]);

  const loadCertificates = async (profileId: string) => {
    const { data } = await supabase
      .from('doctor_certificates')
      .select('*')
      .eq('doctor_profile_id', profileId);
    setCertificates((data ?? []) as DoctorCertificate[]);
  };

  useEffect(() => {
    supabase.from('doctor_profiles').select('*').eq('user_id', profile.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setForm({ degree: data.degree, registration_number: data.registration_number, specialty: data.specialty, doctor_category: data.doctor_category, animal_specialty: data.animal_specialty ?? '', district: data.district, city: data.city, pincode: data.pincode, clinic_address: data.clinic_address, clinic_timings: data.clinic_timings, online_slots: data.online_slots, years_experience: String(data.years_experience), certificate_link: data.certificate_link ?? '', short_bio: data.short_bio ?? '' });
      setImages([data.image_one, data.image_two, data.image_three].filter(Boolean));
      setStatus(data.approval_status);
      setDoctorProfileId(data.id);
      loadCertificates(data.id);
    });
  }, [profile.id]);

  const update = (key: keyof typeof form, value: string) => setForm(previous => ({ ...previous, [key]: value }));
  const selectImage = (index: number, file: File | undefined) => { if (!file) return; setImages(previous => { const next = [...previous]; next[index] = file.name; return next.slice(0, 3); }); };

  const handleCertificateUpload = async (type: CertificateType, fileName: string) => {
    if (!doctorProfileId) {
      setNotice('Please submit your application first before uploading certificates.');
      return;
    }
    const { data: existing } = await supabase
      .from('doctor_certificates')
      .select('id')
      .eq('doctor_profile_id', doctorProfileId)
      .eq('certificate_type', type)
      .maybeSingle();

    let result;
    if (existing) {
      result = await supabase
        .from('doctor_certificates')
        .update({ file_reference: fileName, verification_status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      result = await supabase
        .from('doctor_certificates')
        .insert({ doctor_profile_id: doctorProfileId, certificate_type: type, file_reference: fileName, is_optional: type === 'senior_specialist' || type === 'additional_qualification' });
    }

    if (result.error) {
      setNotice('Could not upload certificate. Please try again.');
    } else {
      setNotice(`${fileName} uploaded for verification.`);
      loadCertificates(doctorProfileId);
    }
  };

  const submit = async () => {
    if (status === 'approved') return;
    setBusy(true); setNotice('');
    const applicationFields = { ...form, full_name: profile.full_name, years_experience: Number(form.years_experience), image_one: images[0] ?? null, image_two: images[1] ?? null, image_three: images[2] ?? null };
    const { data: existing } = await supabase.from('doctor_profiles').select('id').eq('user_id', profile.id).maybeSingle();
    const result = existing
      ? await supabase.from('doctor_profiles').update({ ...applicationFields, updated_at: new Date().toISOString() }).eq('id', existing.id)
      : await supabase.from('doctor_profiles').insert(applicationFields);
    if (result.error) { console.error('doctor application save failed', result.error); setNotice('We could not save your application. Please check the details and try again.'); }
    else { setStatus('pending'); setNotice('Submitted for owner verification. Patient access stays blocked until approval.'); if (existing) loadCertificates(existing.id); }
    setBusy(false);
  };

  const input = (key: keyof typeof form, placeholder: string, type = 'text') => <input className="field" type={type} placeholder={placeholder} value={form[key]} onChange={event => update(key, event.target.value)} />;

  return (
    <main className="min-h-screen bg-[#fbfaf7] px-5 py-6 text-slate-800">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div><BrandLogo /></div>
          <button onClick={onLogout} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-white"><LogOut className="h-4 w-4" /> Sign out</button>
        </header>

        <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-[0_20px_55px_rgba(30,54,52,.08)] sm:p-10">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[.25em] text-slate-400">Doctor onboarding</p>
              <h1 className="mt-2 font-serif text-4xl italic">Register your practice</h1>
              <p className="mt-2 text-sm text-slate-500">Your account starts as Pending Verification. Patient access stays blocked until the platform owner approves it.</p>
            </div>
            <span className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider ${status === 'approved' ? 'bg-emerald-50 text-emerald-700' : status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{status === 'new' ? 'Not submitted' : status}</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {input('degree', 'Degree, e.g. MBBS, MD')}
            {input('registration_number', 'Medical council registration number')}
            {input('specialty', 'Specialty')}
            <select className="field" value={form.doctor_category} onChange={event => update('doctor_category', event.target.value)}><option value="human">Human medical doctors</option><option value="veterinary">Veterinary doctors</option></select>
            {form.doctor_category === 'veterinary' && <select className="field" value={form.animal_specialty} onChange={event => update('animal_specialty', event.target.value)}><option value="">Animal focus</option><option>Pets</option><option>Cow and livestock</option></select>}
            {input('district', 'District')}
            {input('city', 'City')}
            {input('pincode', 'Pincode', 'text')}
            {input('clinic_timings', 'Clinic timings')}
            {input('online_slots', 'Online consultation slots')}
            {input('years_experience', 'Years of experience', 'number')}
            <div className="md:col-span-2">{input('clinic_address', 'Clinic address')}</div>
            <div className="md:col-span-2">{input('short_bio', 'Short bio')}</div>
          </div>

          <div className="mt-7">
            <p className="mb-3 text-sm font-semibold">Profile images</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map(index => (
                <label key={index} className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center hover:border-teal-400">
                  <FileImage className="mb-2 h-6 w-6 text-teal-700" />
                  <span className="text-xs font-semibold text-slate-600">{images[index] ?? `Choose image ${index + 1}`}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={event => selectImage(index, event.target.files?.[0])} />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <CertificateChain certificates={certificates} onUpload={handleCertificateUpload} />
          </div>

          {notice && <p className="mt-5 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{notice}</p>}
          <button onClick={submit} disabled={busy || status === 'approved'} className="primary-button mt-7 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed">
            {status === 'approved' ? <><CheckCircle2 className="h-5 w-5" /> Approved profile</> : <><UploadCloud className="h-5 w-5" />{busy ? 'Saving application…' : 'Submit for verification'}</>}
          </button>
        </div>
      </div>
    </main>
  );
}
