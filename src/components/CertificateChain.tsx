import { FileText, CheckCircle2, XCircle, Clock3, ShieldCheck, UploadCloud, Link2 } from 'lucide-react';
import type { DoctorCertificate, CertificateType } from '@/types';

interface Props {
  certificates: DoctorCertificate[];
  onUpload: (type: CertificateType, fileName: string) => void;
  adminMode?: boolean;
  onVerify?: (certificateId: string, status: 'verified' | 'rejected', reason?: string) => void;
}

interface CertMeta {
  label: string;
  description: string;
  optional: boolean;
}

const CERT_META: Record<CertificateType, CertMeta> = {
  national_medical_register: { label: 'National Medical Register Certificate', description: 'Proof of registration with the National Medical Register (NMC).', optional: false },
  state_medical_council: { label: 'State Medical Council Registration', description: 'Active registration with your state medical council.', optional: false },
  degree: { label: 'Degree Certificates', description: 'MBBS and primary medical degree certificates.', optional: false },
  senior_specialist: { label: 'Senior Specialist Certificate (MD / MS / DM)', description: 'Required only for senior specialists. Upload if applicable.', optional: true },
  experience: { label: 'Experience Certificate', description: 'Work experience certificates from previous or current employers.', optional: false },
  additional_qualification: { label: 'Additional Qualification Certificate', description: 'Any additional diplomas, fellowships, or certifications.', optional: true },
};

const CHAIN_ORDER: CertificateType[] = [
  'national_medical_register',
  'state_medical_council',
  'degree',
  'senior_specialist',
  'experience',
  'additional_qualification',
];

const MANDATORY_TYPES = CHAIN_ORDER.filter(type => !CERT_META[type].optional);

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: typeof CheckCircle2; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Clock3, label: 'Pending review' },
  verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2, label: 'Verified' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, label: 'Rejected' },
};

export default function CertificateChain({ certificates, onUpload, adminMode, onVerify }: Props) {
  const getCert = (type: CertificateType) => certificates.find(c => c.certificate_type === type);
  const allMandatoryVerified = MANDATORY_TYPES.every(type => getCert(type)?.verification_status === 'verified');

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-slate-800">Certificate Verification Chain</h3>
        </div>
        {allMandatoryVerified && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Mandatory chain complete
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
        <div className="space-y-4">
          {CHAIN_ORDER.map((type, index) => {
            const meta = CERT_META[type];
            const cert = getCert(type);
            const status = cert ? STATUS_STYLES[cert.verification_status] : null;
            const StatusIcon = status?.icon ?? Clock3;

            return (
              <div key={type} className="relative flex items-start gap-4">
                <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 ${
                  cert?.verification_status === 'verified'
                    ? 'border-emerald-400 bg-emerald-50'
                    : cert?.verification_status === 'rejected'
                    ? 'border-red-400 bg-red-50'
                    : cert
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-200 bg-slate-50'
                }`}>
                  <FileText className={`h-5 w-5 ${
                    cert?.verification_status === 'verified' ? 'text-emerald-600'
                    : cert?.verification_status === 'rejected' ? 'text-red-500'
                    : cert ? 'text-amber-600' : 'text-slate-300'
                  }`} />
                </div>

                <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Step {index + 1}: {meta.label}
                        {meta.optional && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">Optional</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{meta.description}</p>
                      {cert ? (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Link2 className="h-3 w-3" />
                          {cert.file_reference}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-slate-400">Not uploaded yet</p>
                      )}
                    </div>

                    {status && (
                      <span className={`flex shrink-0 items-center gap-1 rounded-full ${status.bg} px-2.5 py-1 text-[11px] font-bold ${status.text}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>
                    )}
                  </div>

                  {cert?.verification_status === 'rejected' && cert.rejection_reason && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{cert.rejection_reason}</p>
                  )}

                  {cert?.verified_at && (
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Verified on {new Date(cert.verified_at).toLocaleDateString()}
                    </p>
                  )}

                  {!cert && (
                    <label className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700">
                      <UploadCloud className="h-3.5 w-3.5" />
                      Upload {meta.label}
                      <input
                        type="file"
                        accept="application/pdf,.pdf,image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) onUpload(type, file.name);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  )}

                  {adminMode && cert && cert.verification_status === 'pending' && onVerify && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => onVerify(cert.id, 'verified')}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                      </button>
                      <button
                        onClick={() => onVerify(cert.id, 'rejected', 'Document could not be confirmed.')}
                        className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-400">
        <ShieldCheck className="h-4 w-4 shrink-0 text-teal-500" />
        Mandatory certificates must all be verified before patient consultations begin. Optional certificates enhance your profile but are not required for approval.
      </div>
    </div>
  );
}
