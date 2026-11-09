export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'es' | 'fr' | 'de' | 'ar' | 'zh' | 'pt';

export interface UserProfile {
  id: string;
  username: string;
  role: 'doctor' | 'patient' | 'admin';
  full_name: string;
  age: number;
  gender: string;
  address: string;
  state: string;
  district: string;
  pincode: string;
  mobile_number?: string;
}

export interface Language {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  flag: string;
}

export type DoctorStatus = 'online' | 'offline';

export interface Doctor {
  id: string;
  name: string;
  location: string;
  experience: number;
  rating: number;
  status: DoctorStatus;
  specialty: string;
  category?: 'human' | 'veterinary';
  initials: string;
  prices?: Partial<Record<PricingTier, number>>;
}

export interface Procedure {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  doctors: Doctor[];
}

export type PricingTier = 'essential' | 'essential_plus' | 'audio' | 'video';

export interface TierInfo {
  id: PricingTier;
  label: string;
  price: number;
  texts?: number;
  images?: number;
  type: 'text' | 'audio' | 'video';
}

export type CertificateType =
  | 'national_medical_register'
  | 'state_medical_council'
  | 'degree'
  | 'senior_specialist'
  | 'experience'
  | 'additional_qualification';

export type CertificateStatus = 'pending' | 'verified' | 'rejected';

export interface DoctorCertificate {
  id: string;
  doctor_profile_id: string;
  certificate_type: CertificateType;
  file_reference: string;
  verification_status: CertificateStatus;
  is_optional: boolean;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
}

export type AppScreen = 'language' | 'home' | 'doctors' | 'triage' | 'pricing' | 'payment' | 'chat' | 'ended' | 'call' | 'transactions' | 'most-used' | 'support';
